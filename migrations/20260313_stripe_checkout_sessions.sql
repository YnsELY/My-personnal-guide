-- Migration: Stripe checkout pending sessions storage
-- Date: 2026-03-13

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.stripe_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkout_session_id TEXT UNIQUE,
  payment_intent_id TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  service_code TEXT,
  reservation_payload JSONB NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  wallet_hold_amount NUMERIC NOT NULL DEFAULT 0 CHECK (wallet_hold_amount >= 0),
  card_amount NUMERIC NOT NULL DEFAULT 0 CHECK (card_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'finalized', 'failed', 'cancelled', 'expired', 'conflict_credited')),
  failure_reason TEXT,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_user_status
  ON public.stripe_checkout_sessions (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_created_at
  ON public.stripe_checkout_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_checkout_session_id
  ON public.stripe_checkout_sessions (checkout_session_id);

ALTER TABLE public.stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stripe checkout sessions" ON public.stripe_checkout_sessions;
CREATE POLICY "Users can view own stripe checkout sessions"
  ON public.stripe_checkout_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Service role can manage stripe checkout sessions" ON public.stripe_checkout_sessions;
CREATE POLICY "Service role can manage stripe checkout sessions"
  ON public.stripe_checkout_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS set_stripe_checkout_sessions_updated_at ON public.stripe_checkout_sessions;
CREATE TRIGGER set_stripe_checkout_sessions_updated_at
  BEFORE UPDATE ON public.stripe_checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

