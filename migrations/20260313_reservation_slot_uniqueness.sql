-- Migration: Active reservation slot uniqueness per guide
-- Date: 2026-03-13

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_active_guide_slot
  ON public.reservations (guide_id, start_date, visit_time)
  WHERE status IN ('pending', 'confirmed', 'in_progress')
    AND visit_time IS NOT NULL;

