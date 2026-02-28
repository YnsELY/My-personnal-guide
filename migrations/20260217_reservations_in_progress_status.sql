-- Migration: Add in_progress reservation status for guide visit workflow
-- Date: 2026-02-17

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reservations_status_check'
      AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations DROP CONSTRAINT reservations_status_check;
  END IF;

  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_status_check
      CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
