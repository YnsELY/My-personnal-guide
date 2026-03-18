-- Migration: Omra Badal proofs (video uploads)
-- Date: 2026-03-13

CREATE TABLE IF NOT EXISTS public.reservation_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pilgrim_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('ihram_start_video', 'omra_completion_video')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reservation_proofs_reservation_type UNIQUE (reservation_id, proof_type)
);

CREATE INDEX IF NOT EXISTS idx_reservation_proofs_reservation
  ON public.reservation_proofs (reservation_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservation_proofs_guide
  ON public.reservation_proofs (guide_id, uploaded_at DESC);

ALTER TABLE public.reservation_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guide pilgrim admin can view reservation proofs" ON public.reservation_proofs;
CREATE POLICY "Guide pilgrim admin can view reservation proofs"
  ON public.reservation_proofs FOR SELECT
  USING (auth.uid() = guide_id OR auth.uid() = pilgrim_id OR public.is_admin());

DROP POLICY IF EXISTS "Guide can upload own reservation proofs" ON public.reservation_proofs;
CREATE POLICY "Guide can upload own reservation proofs"
  ON public.reservation_proofs FOR INSERT
  WITH CHECK (auth.uid() = guide_id OR public.is_admin());

DROP POLICY IF EXISTS "Guide can update own reservation proofs" ON public.reservation_proofs;
CREATE POLICY "Guide can update own reservation proofs"
  ON public.reservation_proofs FOR UPDATE
  USING (auth.uid() = guide_id OR public.is_admin())
  WITH CHECK (auth.uid() = guide_id OR public.is_admin());

DROP TRIGGER IF EXISTS set_reservation_proofs_updated_at ON public.reservation_proofs;
CREATE TRIGGER set_reservation_proofs_updated_at
  BEFORE UPDATE ON public.reservation_proofs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'omra-badal-proofs',
  'omra-badal-proofs',
  false,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Guides can upload omra badal proof files" ON storage.objects;
CREATE POLICY "Guides can upload omra badal proof files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'omra-badal-proofs'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

DROP POLICY IF EXISTS "Guides can update omra badal proof files" ON storage.objects;
CREATE POLICY "Guides can update omra badal proof files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'omra-badal-proofs'
    AND auth.uid()::text = split_part(name, '/', 1)
  )
  WITH CHECK (
    bucket_id = 'omra-badal-proofs'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

DROP POLICY IF EXISTS "Authorized users can read omra badal proof files" ON storage.objects;
CREATE POLICY "Authorized users can read omra badal proof files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'omra-badal-proofs'
    AND (
      auth.uid()::text = split_part(name, '/', 1)
      OR EXISTS (
        SELECT 1
        FROM public.reservation_proofs rp
        WHERE rp.storage_path = storage.objects.name
          AND (auth.uid() = rp.guide_id OR auth.uid() = rp.pilgrim_id OR public.is_admin())
      )
    )
  );

DROP FUNCTION IF EXISTS public.upsert_reservation_proof(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.upsert_reservation_proof(
  p_reservation_id UUID,
  p_proof_type TEXT,
  p_storage_path TEXT,
  p_public_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reservation public.reservations%ROWTYPE;
  v_proof public.reservation_proofs%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Réservation requise.';
  END IF;

  IF p_proof_type NOT IN ('ihram_start_video', 'omra_completion_video') THEN
    RAISE EXCEPTION 'Type de preuve invalide.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_storage_path, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Fichier de preuve invalide.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_public_url, '')), '') IS NULL THEN
    RAISE EXCEPTION 'URL de preuve invalide.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable.';
  END IF;

  IF v_reservation.guide_id <> v_user_id THEN
    RAISE EXCEPTION 'Seul le guide assigné peut déposer les preuves.';
  END IF;

  IF POSITION('badal' IN LOWER(COALESCE(v_reservation.service_name, ''))) = 0 THEN
    RAISE EXCEPTION 'Les preuves vidéo sont réservées aux prestations Omra Badal.';
  END IF;

  INSERT INTO public.reservation_proofs (
    reservation_id,
    guide_id,
    pilgrim_id,
    proof_type,
    storage_path,
    public_url,
    uploaded_at
  )
  VALUES (
    v_reservation.id,
    v_reservation.guide_id,
    v_reservation.user_id,
    p_proof_type,
    BTRIM(p_storage_path),
    BTRIM(p_public_url),
    NOW()
  )
  ON CONFLICT (reservation_id, proof_type)
  DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    public_url = EXCLUDED.public_url,
    uploaded_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO v_proof;

  RETURN jsonb_build_object(
    'id', v_proof.id,
    'reservationId', v_proof.reservation_id,
    'proofType', v_proof.proof_type,
    'publicUrl', v_proof.public_url,
    'storagePath', v_proof.storage_path,
    'uploadedAt', v_proof.uploaded_at
  );
END;
$$;

DROP FUNCTION IF EXISTS public.get_reservation_proofs(UUID);
CREATE OR REPLACE FUNCTION public.get_reservation_proofs(
  p_reservation_id UUID
)
RETURNS TABLE (
  id UUID,
  reservation_id UUID,
  proof_type TEXT,
  storage_path TEXT,
  public_url TEXT,
  uploaded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  SELECT *
  INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservation introuvable.';
  END IF;

  IF NOT (
    public.is_admin()
    OR v_user_id = v_reservation.guide_id
    OR v_user_id = v_reservation.user_id
  ) THEN
    RAISE EXCEPTION 'Accès refusé.';
  END IF;

  RETURN QUERY
  SELECT
    rp.id,
    rp.reservation_id,
    rp.proof_type,
    rp.storage_path,
    rp.public_url,
    rp.uploaded_at
  FROM public.reservation_proofs rp
  WHERE rp.reservation_id = p_reservation_id
  ORDER BY rp.uploaded_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_reservation_proof(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reservation_proofs(UUID) TO authenticated;
