-- Migration: remove seeded test guide accounts
-- Date: 2026-05-18
--
-- These 4 guide accounts were created by the deprecated seedGuides() function
-- in lib/api.ts. They are not real users and must be removed from production.
--
-- Several FKs to profiles(id) lack ON DELETE CASCADE (services, reservations,
-- reviews, messages, guide_payouts, guide_interviews, admin_audit_logs,
-- reassignment columns), so we must clean those rows manually before deleting
-- the auth.users row.
--
-- Tables that already cascade from auth.users / profiles are left alone:
--   profiles, guides, pilgrim_wallets, *_wallet_transactions,
--   omra_badal_proofs, user_blocks, user_reports,
--   stripe_checkout_sessions, email_notification_logs.
--
-- This migration is idempotent: re-running it is a no-op once accounts are gone.

DO $$
DECLARE
  v_guide_ids UUID[];
  v_deleted_users INT;
BEGIN
  -- 1) Collect the test guide UUIDs
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[])
    INTO v_guide_ids
  FROM auth.users
  WHERE email IN (
    'guide_1@guideomra.com',
    'guide_2@guideomra.com',
    'guide_3@guideomra.com',
    'guide_4@guideomra.com'
  );

  IF array_length(v_guide_ids, 1) IS NULL THEN
    RAISE NOTICE 'No seeded test guide accounts found — nothing to do.';
    RETURN;
  END IF;

  RAISE NOTICE 'Cleaning data for % seeded test guide(s)...', array_length(v_guide_ids, 1);

  -- 2) Clear admin-audit references to these guides (admin_id column)
  --    Cast to text because entity_id is sometimes referenced via UUID.
  DELETE FROM public.admin_audit_logs
   WHERE admin_id = ANY(v_guide_ids);

  -- 3) Reviews authored by these guides as reviewers
  DELETE FROM public.reviews
   WHERE reviewer_id = ANY(v_guide_ids);

  -- 4) Reviews about these guides (FK to guides table cascades from guides → profiles,
  --    but guides row only deletes when profile is gone; we delete reviews here
  --    explicitly to be safe since reviews.guide_id has no cascade defined).
  DELETE FROM public.reviews
   WHERE guide_id = ANY(v_guide_ids);

  -- 5) Messages where the guide is sender or receiver
  DELETE FROM public.messages
   WHERE sender_id = ANY(v_guide_ids)
      OR receiver_id = ANY(v_guide_ids);

  -- 6) Guide payouts
  DELETE FROM public.guide_payouts
   WHERE guide_id = ANY(v_guide_ids);

  -- 7) Guide interviews (guide_id or admin_id — unlikely but safe)
  DELETE FROM public.guide_interviews
   WHERE guide_id = ANY(v_guide_ids)
      OR admin_id = ANY(v_guide_ids);

  -- 8) Null-out reassignment references on any reservation that points to these guides
  UPDATE public.reservations
     SET reassigned_from_guide_id = NULL
   WHERE reassigned_from_guide_id = ANY(v_guide_ids);

  UPDATE public.reservations
     SET reassigned_by_admin_id = NULL
   WHERE reassigned_by_admin_id = ANY(v_guide_ids);

  -- 9) Null-out approval audit columns on guides table (in case any other guide
  --    was approved/rejected by one of these test accounts).
  UPDATE public.guides
     SET approved_by = NULL
   WHERE approved_by = ANY(v_guide_ids);

  UPDATE public.guides
     SET rejected_by = NULL
   WHERE rejected_by = ANY(v_guide_ids);

  -- 10) Null-out reservations.cancelled_by if it points to one of these guides
  UPDATE public.reservations
     SET cancelled_by = NULL
   WHERE cancelled_by = ANY(v_guide_ids);

  -- 11) Reservations where the guide is the provider OR the user (test guides
  --     shouldn't have made reservations as pilgrims, but cover both columns).
  DELETE FROM public.reservations
   WHERE guide_id = ANY(v_guide_ids)
      OR user_id = ANY(v_guide_ids);

  -- 12) Services owned by these guides
  DELETE FROM public.services
   WHERE guide_id = ANY(v_guide_ids);

  -- 13) Finally, delete the auth.users rows.
  --     This cascades to profiles → guides (and all CASCADE-linked tables).
  DELETE FROM auth.users
   WHERE id = ANY(v_guide_ids);

  GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
  RAISE NOTICE 'Removed % seeded test guide account(s).', v_deleted_users;
END $$;
