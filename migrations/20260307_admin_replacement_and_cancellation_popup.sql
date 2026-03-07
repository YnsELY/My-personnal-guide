-- Migration: Admin cancellation popup support + reservation replacement workflow
-- Date: 2026-03-07

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reassigned_from_guide_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reassigned_by_admin_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reassigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reassignment_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_reservations_status_created_at
  ON public.reservations (status, created_at);

CREATE INDEX IF NOT EXISTS idx_reservations_guide_status_created_at
  ON public.reservations (guide_id, status, created_at);

DROP FUNCTION IF EXISTS public.admin_assign_replacement_guide(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.admin_assign_replacement_guide(
  p_reservation_id UUID,
  p_new_guide_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_reservation public.reservations%ROWTYPE;
  v_new_guide public.guides%ROWTYPE;
  v_is_pending_too_long BOOLEAN := false;
  v_is_guide_cancelled BOOLEAN := false;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acces reserve aux administrateurs.';
  END IF;

  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Reservation requise.';
  END IF;

  IF p_new_guide_id IS NULL THEN
    RAISE EXCEPTION 'Nouveau guide requis.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation introuvable.';
  END IF;

  IF v_reservation.guide_id = p_new_guide_id THEN
    RAISE EXCEPTION 'Le guide de remplacement doit être différent du guide actuel.';
  END IF;

  v_is_pending_too_long := (
    v_reservation.status = 'pending'
    AND v_reservation.created_at IS NOT NULL
    AND v_reservation.created_at <= (v_now - INTERVAL '12 hours')
  );

  v_is_guide_cancelled := (
    v_reservation.status = 'cancelled'
    AND (
      v_reservation.cancelled_by = v_reservation.guide_id
      OR v_reservation.cancelled_by IS NULL
    )
  );

  IF NOT (v_is_pending_too_long OR v_is_guide_cancelled) THEN
    RAISE EXCEPTION 'Cette reservation n''est pas eligible au remplacement de guide.';
  END IF;

  SELECT *
  INTO v_new_guide
  FROM public.guides
  WHERE id = p_new_guide_id
    AND (onboarding_status = 'approved' OR verified = true)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guide de remplacement invalide ou non approuve.';
  END IF;

  UPDATE public.reservations
  SET
    reassigned_from_guide_id = v_reservation.guide_id,
    reassigned_by_admin_id = v_admin_id,
    reassigned_at = v_now,
    reassignment_reason = COALESCE(NULLIF(BTRIM(p_reason), ''), 'replacement_admin'),
    guide_id = p_new_guide_id,
    status = 'confirmed',
    guide_start_confirmed_at = NULL,
    pilgrim_start_confirmed_at = NULL,
    visit_started_at = NULL,
    guide_end_confirmed_at = NULL,
    pilgrim_end_confirmed_at = NULL,
    completed_at = NULL,
    cancelled_at = CASE WHEN v_reservation.status = 'cancelled' THEN NULL ELSE cancelled_at END,
    cancelled_by = CASE WHEN v_reservation.status = 'cancelled' THEN NULL ELSE cancelled_by END,
    cancellation_credit_amount = CASE WHEN v_reservation.status = 'cancelled' THEN 0 ELSE COALESCE(cancellation_credit_amount, 0) END,
    cancellation_policy_applied = CASE WHEN v_reservation.status = 'cancelled' THEN NULL ELSE cancellation_policy_applied END,
    payout_status = 'not_due',
    updated_at = v_now
  WHERE id = v_reservation.id;

  INSERT INTO public.admin_audit_logs (
    admin_id,
    entity_type,
    entity_id,
    action,
    payload
  )
  VALUES (
    v_admin_id,
    'reservation',
    v_reservation.id,
    'reassign_reservation_guide',
    jsonb_build_object(
      'previousGuideId', v_reservation.guide_id,
      'newGuideId', p_new_guide_id,
      'reason', COALESCE(NULLIF(BTRIM(p_reason), ''), 'replacement_admin'),
      'trigger', CASE
        WHEN v_is_guide_cancelled THEN 'guide_cancelled'
        WHEN v_is_pending_too_long THEN 'pending_timeout_12h'
        ELSE 'unknown'
      END
    )
  );

  RETURN jsonb_build_object(
    'reservationId', v_reservation.id,
    'previousGuideId', v_reservation.guide_id,
    'newGuideId', p_new_guide_id,
    'status', 'confirmed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_replacement_guide(UUID, UUID, TEXT) TO authenticated;
