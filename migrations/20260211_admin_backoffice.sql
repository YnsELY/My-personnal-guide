-- Migration: Admin backoffice + finance + payouts
-- Date: 2026-02-11

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('pilgrim', 'guide', 'admin'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_account_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_account_status_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_account_status_check CHECK (account_status IN ('active', 'suspended'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_language_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_language_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_language_check CHECK (language IN ('fr', 'ar'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_gender_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_gender_check;
  END IF;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_gender_check CHECK (gender IN ('male', 'female'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.account_status = 'active'
  );
$$;

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guides_onboarding_status_check'
      AND conrelid = 'public.guides'::regclass
  ) THEN
    ALTER TABLE public.guides DROP CONSTRAINT guides_onboarding_status_check;
  END IF;
  ALTER TABLE public.guides
    ADD CONSTRAINT guides_onboarding_status_check CHECK (onboarding_status IN ('pending_review', 'approved', 'rejected'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS service_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'services_service_status_check'
      AND conrelid = 'public.services'::regclass
  ) THEN
    ALTER TABLE public.services DROP CONSTRAINT services_service_status_check;
  END IF;
  ALTER TABLE public.services
    ADD CONSTRAINT services_service_status_check CHECK (service_status IN ('active', 'hidden', 'archived'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS guide_net_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_due',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_payout_status_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations DROP CONSTRAINT reservations_payout_status_check;
  END IF;
  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_payout_status_check CHECK (payout_status IN ('not_due', 'to_pay', 'processing', 'paid', 'failed'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.reservations
  ALTER COLUMN payout_status SET DEFAULT 'not_due';

CREATE TABLE IF NOT EXISTS public.guide_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('to_pay', 'processing', 'paid', 'failed')) DEFAULT 'to_pay',
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guide_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage guides" ON public.guides;
CREATE POLICY "Admins can manage guides"
  ON public.guides FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete services" ON public.services;
CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view related reservations" ON public.reservations;
CREATE POLICY "Users can view related reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users and guides can update own reservations" ON public.reservations;
CREATE POLICY "Users and guides can update own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR auth.uid() = guide_id OR public.is_admin());

DROP POLICY IF EXISTS "Guides can view own payouts" ON public.guide_payouts;
CREATE POLICY "Guides can view own payouts"
  ON public.guide_payouts FOR SELECT
  USING (auth.uid() = guide_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage payouts" ON public.guide_payouts;
CREATE POLICY "Admins can manage payouts"
  ON public.guide_payouts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can write audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can write audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_guides_updated_at ON public.guides;
CREATE TRIGGER set_guides_updated_at
  BEFORE UPDATE ON public.guides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_guide_payouts_updated_at ON public.guide_payouts;
CREATE TRIGGER set_guide_payouts_updated_at
  BEFORE UPDATE ON public.guide_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
