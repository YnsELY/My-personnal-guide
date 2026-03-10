-- Migration: Recommended guides ranking RPC (top 5)
-- Date: 2026-03-09

CREATE INDEX IF NOT EXISTS idx_reservations_guide_completed
  ON public.reservations (guide_id)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_reviews_guide_id
  ON public.reviews (guide_id);

DROP FUNCTION IF EXISTS public.get_recommended_guides(INT);

CREATE OR REPLACE FUNCTION public.get_recommended_guides(
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  gender TEXT,
  specialty TEXT,
  price_per_day NUMERIC,
  currency TEXT,
  price_unit TEXT,
  languages TEXT[],
  location TEXT,
  verified BOOLEAN,
  bio TEXT,
  completed_services_count BIGINT,
  reviews_count BIGINT,
  average_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 5), 1), 5);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez etre connecte.';
  END IF;

  RETURN QUERY
  WITH eligible_guides AS (
    SELECT
      g.id,
      g.specialty,
      g.price_per_day,
      g.currency,
      g.price_unit,
      g.languages,
      g.location,
      g.verified,
      g.bio,
      p.full_name,
      p.avatar_url,
      p.gender
    FROM public.guides g
    LEFT JOIN public.profiles p
      ON p.id = g.id
    WHERE g.onboarding_status = 'approved' OR g.verified = true
  ),
  completed_counts AS (
    SELECT
      r.guide_id,
      COUNT(*)::BIGINT AS completed_services_count
    FROM public.reservations r
    WHERE r.status = 'completed'
    GROUP BY r.guide_id
  ),
  review_stats AS (
    SELECT
      rv.guide_id,
      COUNT(*)::BIGINT AS reviews_count,
      ROUND(AVG(rv.rating)::numeric, 2) AS average_rating
    FROM public.reviews rv
    GROUP BY rv.guide_id
  )
  SELECT
    eg.id,
    eg.full_name,
    eg.avatar_url,
    eg.gender,
    eg.specialty,
    eg.price_per_day,
    eg.currency,
    eg.price_unit,
    eg.languages,
    eg.location,
    eg.verified,
    eg.bio,
    COALESCE(cc.completed_services_count, 0)::BIGINT AS completed_services_count,
    COALESCE(rs.reviews_count, 0)::BIGINT AS reviews_count,
    COALESCE(rs.average_rating, 0)::NUMERIC AS average_rating
  FROM eligible_guides eg
  LEFT JOIN completed_counts cc
    ON cc.guide_id = eg.id
  LEFT JOIN review_stats rs
    ON rs.guide_id = eg.id
  ORDER BY
    COALESCE(cc.completed_services_count, 0) DESC,
    COALESCE(rs.reviews_count, 0) DESC,
    COALESCE(rs.average_rating, 0) DESC,
    eg.verified DESC,
    COALESCE(eg.full_name, '') ASC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recommended_guides(INT) TO authenticated;
