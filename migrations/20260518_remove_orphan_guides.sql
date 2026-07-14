-- Migration: remove orphan guide accounts (no matching auth.users row)
-- Date: 2026-05-18
--
-- Targets profiles with role='guide' (or guides rows) whose id does NOT exist
-- in auth.users. Under normal cascade behavior this should never happen, but
-- if a previous bulk delete bypassed cascades or data was inserted manually,
-- orphans may remain and continue to appear in the app.
--
-- Strategy: for each orphan guide id, clean up all FK references in tables
-- that point to profiles(id) WITHOUT ON DELETE CASCADE, then delete the
-- profile row (which cascades to guides and CASCADE-linked tables).
--
-- This migration is idempotent: re-running it is a no-op once orphans are gone.

DO $$
DECLARE
  v_orphan_ids UUID[];
  v_count INT;
BEGIN
  -- 1) Collect orphan guide UUIDs
  --    Match either profiles.role='guide' OR a row in guides table,
  --    where the id has no matching auth.users row.
  SELECT COALESCE(array_agg(DISTINCT orphan_id), ARRAY[]::UUID[])
    INTO v_orphan_ids
  FROM (
    SELECT p.id AS orphan_id
      FROM public.profiles p
     WHERE p.role = 'guide'
       AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
    UNION
    SELECT g.id AS orphan_id
      FROM public.guides g
     WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = g.id)
  ) AS orphans;

  IF array_length(v_orphan_ids, 1) IS NULL THEN
    RAISE NOTICE 'No orphan guide accounts found — nothing to do.';
    RETURN;
  END IF;

  RAISE NOTICE 'Cleaning data for % orphan guide account(s)...', array_length(v_orphan_ids, 1);

  -- 2) FK references in tables WITHOUT ON DELETE CASCADE — delete first
  DELETE FROM public.admin_audit_logs
   WHERE admin_id = ANY(v_orphan_ids);

  DELETE FROM public.reviews
   WHERE reviewer_id = ANY(v_orphan_ids)
      OR guide_id = ANY(v_orphan_ids);

  DELETE FROM public.messages
   WHERE sender_id = ANY(v_orphan_ids)
      OR receiver_id = ANY(v_orphan_ids);

  DELETE FROM public.guide_payouts
   WHERE guide_id = ANY(v_orphan_ids);

  DELETE FROM public.guide_interviews
   WHERE guide_id = ANY(v_orphan_ids)
      OR admin_id = ANY(v_orphan_ids);

  -- 3) Null-out reassignment / approval / cancellation audit columns
  UPDATE public.reservations
     SET reassigned_from_guide_id = NULL
   WHERE reassigned_from_guide_id = ANY(v_orphan_ids);

  UPDATE public.reservations
     SET reassigned_by_admin_id = NULL
   WHERE reassigned_by_admin_id = ANY(v_orphan_ids);

  UPDATE public.reservations
     SET cancelled_by = NULL
   WHERE cancelled_by = ANY(v_orphan_ids);

  UPDATE public.guides
     SET approved_by = NULL
   WHERE approved_by = ANY(v_orphan_ids);

  UPDATE public.guides
     SET rejected_by = NULL
   WHERE rejected_by = ANY(v_orphan_ids);

  -- 4) Reservations linked to these guides (provider or user)
  DELETE FROM public.reservations
   WHERE guide_id = ANY(v_orphan_ids)
      OR user_id = ANY(v_orphan_ids);

  -- 5) Services owned by these guides
  DELETE FROM public.services
   WHERE guide_id = ANY(v_orphan_ids);

  -- 6) Delete the guides rows (in case the profile->guide cascade is broken
  --    or the guide row exists without a matching profile).
  DELETE FROM public.guides
   WHERE id = ANY(v_orphan_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Removed % orphan row(s) from public.guides.', v_count;

  -- 7) Delete the orphan profiles. CASCADE-linked tables clean themselves.
  DELETE FROM public.profiles
   WHERE id = ANY(v_orphan_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Removed % orphan row(s) from public.profiles.', v_count;
END $$;
