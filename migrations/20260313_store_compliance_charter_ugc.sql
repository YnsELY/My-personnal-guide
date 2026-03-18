-- Migration: Store compliance foundations (pilgrim charter + UGC report/block)
-- Date: 2026-03-13

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pilgrim_charter_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pilgrim_charter_version TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_pilgrim_charter_acceptance_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations
      DROP CONSTRAINT reservations_pilgrim_charter_acceptance_check;
  END IF;

  -- Keep historical rows valid while enforcing new reservations.
  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_pilgrim_charter_acceptance_check
      CHECK (
        created_at < TIMESTAMPTZ '2026-03-13 00:00:00+00'
        OR pilgrim_charter_accepted_at IS NOT NULL
      );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker
  ON public.user_blocks (blocker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON public.user_blocks (blocked_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context TEXT NOT NULL CHECK (context IN ('chat', 'guide_profile')),
  category TEXT NOT NULL CHECK (category IN ('harassment', 'fraud', 'inappropriate_content', 'safety', 'other')),
  description TEXT,
  conversation_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
  admin_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON public.user_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_target_created
  ON public.user_reports (target_user_id, created_at DESC);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users and admins can view related blocks" ON public.user_blocks;
CREATE POLICY "Users and admins can view related blocks"
  ON public.user_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create own blocks" ON public.user_blocks;
CREATE POLICY "Users can create own blocks"
  ON public.user_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks"
  ON public.user_blocks FOR DELETE
  USING (auth.uid() = blocker_id OR public.is_admin());

DROP POLICY IF EXISTS "Reporter and admins can view reports" ON public.user_reports;
CREATE POLICY "Reporter and admins can view reports"
  ON public.user_reports FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create reports" ON public.user_reports;
CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can update reports" ON public.user_reports;
CREATE POLICY "Admins can update reports"
  ON public.user_reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS set_user_reports_updated_at ON public.user_reports;
CREATE TRIGGER set_user_reports_updated_at
  BEFORE UPDATE ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP FUNCTION IF EXISTS public.block_user(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.block_user(
  p_blocked_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_blocked_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur à bloquer requis.';
  END IF;

  IF p_blocked_user_id = v_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous bloquer vous-même.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_blocked_user_id
  ) THEN
    RAISE EXCEPTION 'Utilisateur introuvable.';
  END IF;

  INSERT INTO public.user_blocks (
    blocker_id,
    blocked_id,
    reason,
    created_at
  )
  VALUES (
    v_user_id,
    p_blocked_user_id,
    NULLIF(BTRIM(COALESCE(p_reason, '')), ''),
    v_now
  )
  ON CONFLICT (blocker_id, blocked_id)
  DO UPDATE SET
    reason = EXCLUDED.reason,
    created_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'blockerId', v_user_id,
    'blockedId', p_blocked_user_id
  );
END;
$$;

DROP FUNCTION IF EXISTS public.unblock_user(UUID);
CREATE OR REPLACE FUNCTION public.unblock_user(
  p_blocked_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_blocked_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur à débloquer requis.';
  END IF;

  DELETE FROM public.user_blocks
  WHERE blocker_id = v_user_id
    AND blocked_id = p_blocked_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'blockerId', v_user_id,
    'blockedId', p_blocked_user_id
  );
END;
$$;

DROP FUNCTION IF EXISTS public.get_block_state(UUID);
CREATE OR REPLACE FUNCTION public.get_block_state(
  p_other_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_blocked_by_me BOOLEAN := false;
  v_has_blocked_me BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_other_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur requis.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE blocker_id = v_user_id
      AND blocked_id = p_other_user_id
  )
  INTO v_is_blocked_by_me;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE blocker_id = p_other_user_id
      AND blocked_id = v_user_id
  )
  INTO v_has_blocked_me;

  RETURN jsonb_build_object(
    'isBlockedByMe', v_is_blocked_by_me,
    'hasBlockedMe', v_has_blocked_me
  );
END;
$$;

DROP FUNCTION IF EXISTS public.create_user_report(UUID, TEXT, TEXT, TEXT, UUID, UUID);
CREATE OR REPLACE FUNCTION public.create_user_report(
  p_target_user_id UUID,
  p_context TEXT,
  p_category TEXT,
  p_description TEXT DEFAULT NULL,
  p_conversation_user_id UUID DEFAULT NULL,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_report_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur signalé requis.';
  END IF;

  IF p_target_user_id = v_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous signaler vous-même.';
  END IF;

  IF p_context NOT IN ('chat', 'guide_profile') THEN
    RAISE EXCEPTION 'Contexte de signalement invalide.';
  END IF;

  IF p_category NOT IN ('harassment', 'fraud', 'inappropriate_content', 'safety', 'other') THEN
    RAISE EXCEPTION 'Catégorie de signalement invalide.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'Utilisateur signalé introuvable.';
  END IF;

  INSERT INTO public.user_reports (
    reporter_id,
    target_user_id,
    context,
    category,
    description,
    conversation_user_id,
    reservation_id,
    status
  )
  VALUES (
    v_user_id,
    p_target_user_id,
    p_context,
    p_category,
    NULLIF(BTRIM(COALESCE(p_description, '')), ''),
    p_conversation_user_id,
    p_reservation_id,
    'open'
  )
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object(
    'reportId', v_report_id,
    'status', 'open'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.block_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_block_state(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_report(UUID, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
