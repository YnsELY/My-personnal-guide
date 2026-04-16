-- Add push_token column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Function called by pilgrims after booking:
-- returns push_token for the target guide + all active admins.
-- SECURITY DEFINER to bypass RLS (any authenticated user can call it).
CREATE OR REPLACE FUNCTION public.get_notification_tokens_for_guide(p_guide_id UUID)
RETURNS TABLE(push_token TEXT, role TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT push_token, role
  FROM profiles
  WHERE (id = p_guide_id OR role = 'admin')
    AND push_token IS NOT NULL
    AND account_status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_notification_tokens_for_guide(UUID) TO authenticated;
