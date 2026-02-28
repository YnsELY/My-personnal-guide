-- Migration: Guide interviews workflow (admin proposal / guide counter-proposal)
-- Date: 2026-02-16

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.guide_interviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guide_id UUID REFERENCES public.profiles(id) NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  whatsapp_contact TEXT,
  status TEXT DEFAULT 'pending_guide',
  proposed_by TEXT DEFAULT 'admin',
  admin_note TEXT,
  guide_note TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.guide_interviews
  ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_guide',
  ADD COLUMN IF NOT EXISTS proposed_by TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS guide_note TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guide_interviews_status_check'
      AND conrelid = 'public.guide_interviews'::regclass
  ) THEN
    ALTER TABLE public.guide_interviews DROP CONSTRAINT guide_interviews_status_check;
  END IF;

  ALTER TABLE public.guide_interviews
    ADD CONSTRAINT guide_interviews_status_check
      CHECK (status IN ('pending_guide', 'pending_admin', 'accepted', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guide_interviews_proposed_by_check'
      AND conrelid = 'public.guide_interviews'::regclass
  ) THEN
    ALTER TABLE public.guide_interviews DROP CONSTRAINT guide_interviews_proposed_by_check;
  END IF;

  ALTER TABLE public.guide_interviews
    ADD CONSTRAINT guide_interviews_proposed_by_check
      CHECK (proposed_by IN ('admin', 'guide'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.guide_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides and admins can view guide interviews" ON public.guide_interviews;
CREATE POLICY "Guides and admins can view guide interviews"
  ON public.guide_interviews FOR SELECT
  USING (auth.uid() = guide_id OR auth.uid() = admin_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can create guide interviews" ON public.guide_interviews;
CREATE POLICY "Admins can create guide interviews"
  ON public.guide_interviews FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update guide interviews" ON public.guide_interviews;
CREATE POLICY "Admins can update guide interviews"
  ON public.guide_interviews FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Guides can update own guide interviews" ON public.guide_interviews;
CREATE POLICY "Guides can update own guide interviews"
  ON public.guide_interviews FOR UPDATE
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);

DROP POLICY IF EXISTS "Admins can delete guide interviews" ON public.guide_interviews;
CREATE POLICY "Admins can delete guide interviews"
  ON public.guide_interviews FOR DELETE
  USING (public.is_admin());

DROP TRIGGER IF EXISTS set_guide_interviews_updated_at ON public.guide_interviews;
CREATE TRIGGER set_guide_interviews_updated_at
  BEFORE UPDATE ON public.guide_interviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
