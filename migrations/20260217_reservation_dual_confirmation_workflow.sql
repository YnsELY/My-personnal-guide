-- Migration: Reservation dual confirmation workflow (start/end)
-- Date: 2026-02-17

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS guide_start_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pilgrim_start_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guide_end_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pilgrim_end_confirmed_at TIMESTAMPTZ;
