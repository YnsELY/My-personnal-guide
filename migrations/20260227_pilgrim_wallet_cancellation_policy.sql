-- Migration: Pilgrim wallet + cancellation policy (>48h credit)
-- Date: 2026-02-27

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.pilgrim_wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'EUR',
  available_balance NUMERIC NOT NULL DEFAULT 0,
  total_credited NUMERIC NOT NULL DEFAULT 0,
  total_debited NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pilgrim_wallets_non_negative_check CHECK (
    available_balance >= 0
    AND total_credited >= 0
    AND total_debited >= 0
  )
);

CREATE TABLE IF NOT EXISTS public.pilgrim_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  type TEXT NOT NULL CHECK (type IN ('cancellation_credit', 'booking_debit', 'admin_adjustment')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  balance_before NUMERIC NOT NULL CHECK (balance_before >= 0),
  balance_after NUMERIC NOT NULL CHECK (balance_after >= 0),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS wallet_amount_used NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_amount_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS cancellation_credit_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_policy_applied TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_cancellation_policy_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations DROP CONSTRAINT reservations_cancellation_policy_check;
  END IF;

  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_cancellation_policy_check
      CHECK (
        cancellation_policy_applied IS NULL
        OR cancellation_policy_applied IN ('full_credit_over_48h', 'no_credit_under_48h')
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_wallet_amount_non_negative_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations DROP CONSTRAINT reservations_wallet_amount_non_negative_check;
  END IF;

  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_wallet_amount_non_negative_check
      CHECK (
        COALESCE(wallet_amount_used, 0) >= 0
        AND COALESCE(card_amount_paid, 0) >= 0
        AND COALESCE(cancellation_credit_amount, 0) >= 0
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pilgrim_wallet_transactions_user_created
  ON public.pilgrim_wallet_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilgrim_wallet_transactions_reservation
  ON public.pilgrim_wallet_transactions (reservation_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_status_start_date
  ON public.reservations (user_id, status, start_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pilgrim_wallet_tx_reservation_type
  ON public.pilgrim_wallet_transactions (reservation_id, type)
  WHERE reservation_id IS NOT NULL
    AND type IN ('cancellation_credit', 'booking_debit');

ALTER TABLE public.pilgrim_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilgrim_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pilgrims and admins can view wallets" ON public.pilgrim_wallets;
CREATE POLICY "Pilgrims and admins can view wallets"
  ON public.pilgrim_wallets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Pilgrims and admins can view wallet transactions" ON public.pilgrim_wallet_transactions;
CREATE POLICY "Pilgrims and admins can view wallet transactions"
  ON public.pilgrim_wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP TRIGGER IF EXISTS set_pilgrim_wallets_updated_at ON public.pilgrim_wallets;
CREATE TRIGGER set_pilgrim_wallets_updated_at
  BEFORE UPDATE ON public.pilgrim_wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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

CREATE OR REPLACE FUNCTION public.cancel_reservation_as_pilgrim_with_policy(
  p_reservation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_reservation public.reservations%ROWTYPE;
  v_time_text TEXT;
  v_service_start_at TIMESTAMPTZ;
  v_cutoff_at TIMESTAMPTZ;
  v_credited_amount NUMERIC := 0;
  v_policy_applied TEXT := 'no_credit_under_48h';
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation introuvable ou non eligible a l''annulation.';
  END IF;

  IF v_reservation.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Reservation introuvable ou non eligible a l''annulation.';
  END IF;

  v_time_text := COALESCE(NULLIF(BTRIM(v_reservation.visit_time), ''), '00:00');
  IF v_time_text !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    v_time_text := '00:00';
  END IF;

  v_service_start_at := ((v_reservation.start_date::TEXT || ' ' || v_time_text)::TIMESTAMP AT TIME ZONE 'Europe/Paris');
  v_cutoff_at := v_service_start_at - INTERVAL '48 hours';

  IF v_now < v_cutoff_at THEN
    v_policy_applied := 'full_credit_over_48h';
    v_credited_amount := GREATEST(COALESCE(v_reservation.total_price, 0), 0);
  END IF;

  UPDATE public.reservations
  SET
    status = 'cancelled',
    payout_status = 'not_due',
    cancelled_at = v_now,
    cancelled_by = v_user_id,
    cancellation_credit_amount = v_credited_amount,
    cancellation_policy_applied = v_policy_applied,
    updated_at = v_now
  WHERE id = v_reservation.id;

  IF v_credited_amount > 0 THEN
    INSERT INTO public.pilgrim_wallets (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT available_balance
    INTO v_wallet_before
    FROM public.pilgrim_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_wallet_after := COALESCE(v_wallet_before, 0) + v_credited_amount;

    UPDATE public.pilgrim_wallets
    SET
      available_balance = v_wallet_after,
      total_credited = total_credited + v_credited_amount,
      updated_at = v_now
    WHERE user_id = v_user_id;

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
      'credit',
      'cancellation_credit',
      v_credited_amount,
      COALESCE(v_wallet_before, 0),
      v_wallet_after,
      jsonb_build_object(
        'source', 'cancel_reservation_as_pilgrim_with_policy',
        'serviceStartAt', v_service_start_at,
        'cutoffAt', v_cutoff_at
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'reservationId', v_reservation.id,
    'status', 'cancelled',
    'creditedAmount', COALESCE(v_credited_amount, 0),
    'policyApplied', v_policy_applied,
    'serviceStartAt', v_service_start_at,
    'cutoffAt', v_cutoff_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_wallet(UUID, TEXT, DATE, DATE, NUMERIC, TEXT, TEXT, TEXT[], BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation_as_pilgrim_with_policy(UUID) TO authenticated;
