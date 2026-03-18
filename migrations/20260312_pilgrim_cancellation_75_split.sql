-- Migration: Pilgrim cancellation <48h partial credit (75/25) + guide share
-- Date: 2026-03-12

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS cancellation_retained_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_admin_commission_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_guide_compensation_amount NUMERIC DEFAULT 0;

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
        OR cancellation_policy_applied IN ('full_credit_over_48h', 'partial_credit_under_48h', 'no_credit_under_48h')
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
        AND COALESCE(cancellation_retained_amount, 0) >= 0
        AND COALESCE(cancellation_admin_commission_amount, 0) >= 0
        AND COALESCE(cancellation_guide_compensation_amount, 0) >= 0
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'guide_wallet_adjustments'
      AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE public.guide_wallet_adjustments
      ALTER COLUMN admin_id DROP NOT NULL;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.cancel_reservation_as_pilgrim_with_policy(UUID);

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
  v_total_amount NUMERIC := 0;
  v_credited_amount NUMERIC := 0;
  v_retained_amount NUMERIC := 0;
  v_admin_commission_amount NUMERIC := 0;
  v_guide_compensation_amount NUMERIC := 0;
  v_policy_applied TEXT := 'partial_credit_under_48h';
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
  v_total_amount := ROUND(GREATEST(COALESCE(v_reservation.total_price, 0), 0)::numeric, 2);

  -- Full credit if cancellation happens at least 48h before service start.
  IF v_now <= v_cutoff_at THEN
    v_policy_applied := 'full_credit_over_48h';
    v_credited_amount := v_total_amount;
  ELSE
    v_policy_applied := 'partial_credit_under_48h';
    v_credited_amount := ROUND((v_total_amount * 0.75)::numeric, 2);
    v_retained_amount := ROUND((v_total_amount - v_credited_amount)::numeric, 2);
    v_admin_commission_amount := ROUND((v_retained_amount * 0.60)::numeric, 2);
    v_guide_compensation_amount := ROUND((v_retained_amount - v_admin_commission_amount)::numeric, 2);
  END IF;

  UPDATE public.reservations
  SET
    status = 'cancelled',
    payout_status = 'not_due',
    cancelled_at = v_now,
    cancelled_by = v_user_id,
    cancellation_credit_amount = v_credited_amount,
    cancellation_retained_amount = v_retained_amount,
    cancellation_admin_commission_amount = v_admin_commission_amount,
    cancellation_guide_compensation_amount = v_guide_compensation_amount,
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
        'cutoffAt', v_cutoff_at,
        'policyApplied', v_policy_applied,
        'retainedAmount', v_retained_amount,
        'adminCommissionAmount', v_admin_commission_amount,
        'guideCompensationAmount', v_guide_compensation_amount
      )
    );
  END IF;

  IF v_guide_compensation_amount > 0
    AND v_reservation.guide_id IS NOT NULL
    AND to_regclass('public.guide_wallet_adjustments') IS NOT NULL THEN
    INSERT INTO public.guide_wallet_adjustments (
      guide_id,
      admin_id,
      amount_eur,
      reason
    )
    VALUES (
      v_reservation.guide_id,
      NULL,
      v_guide_compensation_amount,
      'cancellation_under_48h_guide_share'
    );
  END IF;

  RETURN jsonb_build_object(
    'reservationId', v_reservation.id,
    'status', 'cancelled',
    'creditedAmount', COALESCE(v_credited_amount, 0),
    'retainedAmount', COALESCE(v_retained_amount, 0),
    'adminCommissionAmount', COALESCE(v_admin_commission_amount, 0),
    'guideCompensationAmount', COALESCE(v_guide_compensation_amount, 0),
    'policyApplied', v_policy_applied,
    'serviceStartAt', v_service_start_at,
    'cutoffAt', v_cutoff_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_reservation_as_pilgrim_with_policy(UUID) TO authenticated;
