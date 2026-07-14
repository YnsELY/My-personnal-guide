-- Migration: Allow female guide avatar presets
-- Date: 2026-07-14

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
    'preset://16',
    'preset://17',
    'preset://18',
    'preset://female-16',
    'preset://female-17',
    'preset://female-18'
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
