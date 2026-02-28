-- Migration: Add phone number to guides profile
-- Date: 2026-02-28

ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS phone_number TEXT;
