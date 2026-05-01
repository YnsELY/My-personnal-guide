-- Migration: email notification logs for Resend-backed transactional emails
-- Date: 2026-04-25

CREATE TABLE IF NOT EXISTS public.email_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_key TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'pilgrim_signup_confirmation',
      'pilgrim_order_confirmation',
      'guide_booking_confirmation'
    )
  ),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'sent', 'failed')),
  recipient_email TEXT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_notification_logs_type_status_idx
  ON public.email_notification_logs(notification_type, status);

CREATE INDEX IF NOT EXISTS email_notification_logs_profile_idx
  ON public.email_notification_logs(profile_id);

CREATE INDEX IF NOT EXISTS email_notification_logs_reservation_idx
  ON public.email_notification_logs(reservation_id);

ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email notification logs" ON public.email_notification_logs;
CREATE POLICY "Admins can view email notification logs"
  ON public.email_notification_logs FOR SELECT
  USING (public.is_admin());

DROP TRIGGER IF EXISTS set_email_notification_logs_updated_at ON public.email_notification_logs;
CREATE TRIGGER set_email_notification_logs_updated_at
  BEFORE UPDATE ON public.email_notification_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
