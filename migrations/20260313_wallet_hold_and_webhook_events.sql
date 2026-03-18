-- Migration: Stripe webhook events + wallet hold transaction types
-- Date: 2026-03-13

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  checkout_session_id TEXT,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type_processed
  ON public.stripe_webhook_events (event_type, processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_checkout
  ON public.stripe_webhook_events (checkout_session_id);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Admins can view stripe webhook events"
  ON public.stripe_webhook_events FOR SELECT
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can manage stripe webhook events"
  ON public.stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pilgrim_wallet_transactions_type_check'
      AND conrelid = 'public.pilgrim_wallet_transactions'::regclass
  ) THEN
    ALTER TABLE public.pilgrim_wallet_transactions
      DROP CONSTRAINT pilgrim_wallet_transactions_type_check;
  END IF;

  ALTER TABLE public.pilgrim_wallet_transactions
    ADD CONSTRAINT pilgrim_wallet_transactions_type_check
      CHECK (
        type IN (
          'cancellation_credit',
          'booking_debit',
          'admin_adjustment',
          'checkout_wallet_hold',
          'checkout_wallet_release',
          'checkout_conflict_credit'
        )
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

