-- Migration: Switch application currency from SAR to EUR
-- Date: 2026-02-18

ALTER TABLE public.guides
  ALTER COLUMN currency SET DEFAULT 'EUR';

UPDATE public.guides
SET currency = 'EUR'
WHERE currency IS NULL
   OR currency = 'SAR';
