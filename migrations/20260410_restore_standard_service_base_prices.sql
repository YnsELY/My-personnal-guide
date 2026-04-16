-- Restore standard pilgrim-facing service base prices.
-- Fixed guide payouts are handled separately by resolve_fixed_guide_payout().

WITH normalized_services AS (
  SELECT
    id,
    LOWER(
      translate(
        COALESCE(title, '') || ' ' || COALESCE(category, ''),
        'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
        'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuyy'
      )
    ) AS normalized_text
  FROM public.services
)
UPDATE public.services AS s
SET price_override = CASE
  WHEN ns.normalized_text LIKE '%badal%' AND ns.normalized_text LIKE '%ramadan%' THEN 250
  WHEN ns.normalized_text LIKE '%badal%' THEN 150
  WHEN ns.normalized_text LIKE '%visite%' THEN 150
  WHEN ns.normalized_text LIKE '%omra%' AND ns.normalized_text LIKE '%ramadan%' AND (ns.normalized_text LIKE '%seul%' OR ns.normalized_text LIKE '%couple%') THEN 300
  WHEN ns.normalized_text LIKE '%omra%' AND ns.normalized_text LIKE '%ramadan%' AND (ns.normalized_text LIKE '%famille%' OR ns.normalized_text LIKE '%3 a 7%') THEN 350
  WHEN ns.normalized_text LIKE '%omra%' AND ns.normalized_text LIKE '%ramadan%' AND ns.normalized_text LIKE '%groupe%' THEN 400
  WHEN ns.normalized_text LIKE '%omra%' AND (ns.normalized_text LIKE '%seul%' OR ns.normalized_text LIKE '%couple%') THEN 200
  WHEN ns.normalized_text LIKE '%omra%' AND (ns.normalized_text LIKE '%famille%' OR ns.normalized_text LIKE '%3 a 7%') THEN 250
  WHEN ns.normalized_text LIKE '%omra%' AND ns.normalized_text LIKE '%groupe%' THEN 300
  ELSE s.price_override
END
FROM normalized_services AS ns
WHERE ns.id = s.id
  AND (
    ns.normalized_text LIKE '%badal%'
    OR ns.normalized_text LIKE '%visite%'
    OR ns.normalized_text LIKE '%omra%'
  );
