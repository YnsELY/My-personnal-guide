-- Migration: Extend profile avatar preset RPC to WebP preset set
-- Date: 2026-04-24

CREATE OR REPLACE FUNCTION public.update_my_profile_avatar(
  p_avatar_url TEXT
)
RETURNS TABLE(id UUID, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez etre connecte.';
  END IF;

  IF p_avatar_url NOT IN (
    'preset://1', 'preset://2', 'preset://3', 'preset://4',
    'preset://5', 'preset://6', 'preset://7', 'preset://8',
    'preset://16', 'preset://17', 'preset://18'
  ) THEN
    RAISE EXCEPTION 'Avatar non autorise.';
  END IF;

  RETURN QUERY
  UPDATE public.profiles
  SET avatar_url = p_avatar_url
  WHERE profiles.id = v_user_id
  RETURNING profiles.id, profiles.avatar_url;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_profile_avatar(TEXT) TO authenticated;
