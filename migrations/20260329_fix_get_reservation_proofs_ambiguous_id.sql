-- Migration: Fix ambiguous "id" reference in get_reservation_proofs
-- Date: 2026-03-29

CREATE OR REPLACE FUNCTION public.get_reservation_proofs(
  p_reservation_id UUID
)
RETURNS TABLE (
  id UUID,
  reservation_id UUID,
  proof_type TEXT,
  storage_path TEXT,
  public_url TEXT,
  uploaded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations rsv
  WHERE rsv.id = p_reservation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable.';
  END IF;

  IF NOT (
    public.is_admin()
    OR v_user_id = v_reservation.guide_id
    OR v_user_id = v_reservation.user_id
  ) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  RETURN QUERY
  SELECT
    rp.id,
    rp.reservation_id,
    rp.proof_type,
    rp.storage_path,
    rp.public_url,
    rp.uploaded_at
  FROM public.reservation_proofs rp
  WHERE rp.reservation_id = p_reservation_id
  ORDER BY rp.uploaded_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reservation_proofs(UUID) TO authenticated;
