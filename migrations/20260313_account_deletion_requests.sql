-- Migration: Account deletion self-service audit
-- Date: 2026-03-13

CREATE TABLE IF NOT EXISTS public.account_deletions_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT,
  email_snapshot TEXT,
  source TEXT NOT NULL DEFAULT 'self_service' CHECK (source IN ('self_service')),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_deletions_audit_user
  ON public.account_deletions_audit (user_id, deleted_at DESC);

ALTER TABLE public.account_deletions_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read account deletion audit" ON public.account_deletions_audit;
CREATE POLICY "Admins can read account deletion audit"
  ON public.account_deletions_audit FOR SELECT
  USING (public.is_admin());
