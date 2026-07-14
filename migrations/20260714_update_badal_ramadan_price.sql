-- Update existing Omra Badal Ramadan services to the new pilgrim-facing price.

WITH normalized_services AS (
  SELECT
    id,
    LOWER(COALESCE(title, '') || ' ' || COALESCE(category, '')) AS normalized_text
  FROM public.services
)
UPDATE public.services AS s
SET price_override = 300
FROM normalized_services AS ns
WHERE ns.id = s.id
  AND ns.normalized_text LIKE '%badal%'
  AND ns.normalized_text LIKE '%ramadan%';
