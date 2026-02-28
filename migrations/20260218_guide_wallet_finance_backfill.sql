-- Migration: Guide wallet finance backfill and payout normalization
-- Date: 2026-02-18

UPDATE public.reservations
SET commission_rate = 0.15
WHERE status = 'completed'
  AND commission_rate IS NULL;

UPDATE public.reservations
SET platform_fee_amount = ROUND((COALESCE(total_price, 0) * COALESCE(commission_rate, 0.15))::numeric, 2)
WHERE status = 'completed'
  AND platform_fee_amount IS NULL;

UPDATE public.reservations
SET guide_net_amount = ROUND((COALESCE(total_price, 0) - COALESCE(platform_fee_amount, 0))::numeric, 2)
WHERE status = 'completed'
  AND guide_net_amount IS NULL;

UPDATE public.reservations
SET payout_status = 'to_pay'
WHERE status = 'completed'
  AND payout_status = 'not_due';

CREATE INDEX IF NOT EXISTS idx_reservations_guide_status_payout
  ON public.reservations (guide_id, status, payout_status);
