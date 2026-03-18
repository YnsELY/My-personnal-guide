-- Migration: Reservation payment tracking fields for Stripe
-- Date: 2026-03-13

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_payment_status_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations DROP CONSTRAINT reservations_payment_status_check;
  END IF;

  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_payment_status_check
      CHECK (
        payment_status IS NULL
        OR payment_status IN ('pending', 'paid', 'failed', 'canceled')
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_reservations_payment_status
  ON public.reservations (payment_status, created_at DESC);

