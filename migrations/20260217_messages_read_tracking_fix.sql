-- Migration: Ensure message read/unread tracking is reliable
-- Date: 2026-02-17

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

UPDATE public.messages
SET is_read = false
WHERE is_read IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN is_read SET NOT NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages they are part of" ON public.messages;
CREATE POLICY "Users can view messages they are part of"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id OR public.is_admin())
  WITH CHECK (auth.uid() = receiver_id OR public.is_admin());

CREATE INDEX IF NOT EXISTS idx_messages_receiver_is_read
  ON public.messages (receiver_id, is_read);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created_at
  ON public.messages (sender_id, receiver_id, created_at DESC);
