-- Migration: Enforce female pilgrim minimum 2 pilgrims on reservation creation
-- Date: 2026-02-28

CREATE OR REPLACE FUNCTION public.create_reservation_with_wallet(
  p_guide_id UUID,
  p_service_name TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_total_price NUMERIC,
  p_location TEXT,
  p_visit_time TEXT,
  p_pilgrims_names TEXT[],
  p_use_wallet BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_total_price NUMERIC := GREATEST(COALESCE(p_total_price, 0), 0);
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
  v_wallet_used NUMERIC := 0;
  v_card_paid NUMERIC := 0;
  v_reservation public.reservations%ROWTYPE;
  v_role TEXT;
  v_gender TEXT;
  v_valid_pilgrims_count INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_guide_id IS NULL THEN
    RAISE EXCEPTION 'Guide requis.';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Dates de réservation invalides.';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin ne peut pas être avant la date de début.';
  END IF;

  SELECT role, gender
  INTO v_role, v_gender
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  SELECT COUNT(*)
  INTO v_valid_pilgrims_count
  FROM unnest(COALESCE(p_pilgrims_names, ARRAY[]::TEXT[])) AS pilgrim_name
  WHERE NULLIF(BTRIM(pilgrim_name), '') IS NOT NULL;

  IF v_role = 'pilgrim'
    AND v_gender = 'female'
    AND v_valid_pilgrims_count < 2 THEN
    RAISE EXCEPTION 'Pour un compte femme, ajoutez au moins un deuxième pèlerin.';
  END IF;

  INSERT INTO public.pilgrim_wallets (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF COALESCE(p_use_wallet, false) THEN
    SELECT available_balance
    INTO v_wallet_before
    FROM public.pilgrim_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_wallet_used := LEAST(COALESCE(v_wallet_before, 0), v_total_price);

    IF v_wallet_used > 0 THEN
      v_wallet_after := COALESCE(v_wallet_before, 0) - v_wallet_used;

      UPDATE public.pilgrim_wallets
      SET
        available_balance = v_wallet_after,
        total_debited = total_debited + v_wallet_used,
        updated_at = v_now
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  v_card_paid := GREATEST(v_total_price - v_wallet_used, 0);

  INSERT INTO public.reservations (
    user_id,
    guide_id,
    service_name,
    start_date,
    end_date,
    total_price,
    location,
    visit_time,
    pilgrims_names,
    status,
    payout_status,
    wallet_amount_used,
    card_amount_paid,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_guide_id,
    p_service_name,
    p_start_date,
    p_end_date,
    v_total_price,
    p_location,
    p_visit_time,
    p_pilgrims_names,
    'pending',
    'not_due',
    v_wallet_used,
    v_card_paid,
    v_now,
    v_now
  )
  RETURNING * INTO v_reservation;

  IF v_wallet_used > 0 THEN
    INSERT INTO public.pilgrim_wallet_transactions (
      user_id,
      reservation_id,
      direction,
      type,
      amount,
      balance_before,
      balance_after,
      metadata
    )
    VALUES (
      v_user_id,
      v_reservation.id,
      'debit',
      'booking_debit',
      v_wallet_used,
      COALESCE(v_wallet_before, 0),
      COALESCE(v_wallet_after, COALESCE(v_wallet_before, 0)),
      jsonb_build_object(
        'source', 'create_reservation_with_wallet',
        'serviceName', p_service_name,
        'guideId', p_guide_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'reservationId', v_reservation.id,
    'status', v_reservation.status,
    'walletAmountUsed', COALESCE(v_wallet_used, 0),
    'cardAmountPaid', COALESCE(v_card_paid, 0),
    'totalPrice', COALESCE(v_total_price, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_wallet(UUID, TEXT, DATE, DATE, NUMERIC, TEXT, TEXT, TEXT[], BOOLEAN) TO authenticated;
