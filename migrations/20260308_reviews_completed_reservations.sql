-- Migration: Reviews linked to completed reservations (one review per reservation)
-- Date: 2026-03-08

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_reservation_reviewer
  ON public.reviews (reservation_id, reviewer_id)
  WHERE reservation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_reservation
  ON public.reviews (reviewer_id, reservation_id);

CREATE INDEX IF NOT EXISTS idx_reviews_guide_created
  ON public.reviews (guide_id, created_at DESC);

DROP FUNCTION IF EXISTS public.create_review_for_completed_reservation(UUID, INT, TEXT);

CREATE OR REPLACE FUNCTION public.create_review_for_completed_reservation(
  p_reservation_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reservation public.reservations%ROWTYPE;
  v_existing_review_id UUID;
  v_review_id UUID;
  v_review_comment TEXT := NULLIF(BTRIM(COALESCE(p_comment, '')), '');
  v_review_created_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Réservation requise.';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La note doit être comprise entre 1 et 5.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable.';
  END IF;

  IF v_reservation.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez noter que vos propres réservations.';
  END IF;

  IF v_reservation.status <> 'completed' THEN
    RAISE EXCEPTION 'Vous pouvez laisser un avis uniquement après la fin de la visite.';
  END IF;

  SELECT id
  INTO v_existing_review_id
  FROM public.reviews
  WHERE reservation_id = p_reservation_id
    AND reviewer_id = v_user_id
  LIMIT 1;

  IF v_existing_review_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un avis existe déjà pour cette réservation.';
  END IF;

  INSERT INTO public.reviews (
    reviewer_id,
    guide_id,
    reservation_id,
    rating,
    comment
  )
  VALUES (
    v_user_id,
    v_reservation.guide_id,
    p_reservation_id,
    p_rating,
    v_review_comment
  )
  RETURNING id, created_at
  INTO v_review_id, v_review_created_at;

  RETURN jsonb_build_object(
    'id', v_review_id,
    'reservationId', p_reservation_id,
    'reviewerId', v_user_id,
    'guideId', v_reservation.guide_id,
    'rating', p_rating,
    'comment', v_review_comment,
    'createdAt', v_review_created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_review_for_completed_reservation(UUID, INT, TEXT) TO authenticated;
