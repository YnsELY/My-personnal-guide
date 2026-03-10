-- Migration: Admin wallet management (pilgrim + guide)
-- Date: 2026-03-09

CREATE TABLE IF NOT EXISTS public.guide_wallet_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_eur NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guide_wallet_adjustments_amount_non_zero_check CHECK (amount_eur <> 0)
);

CREATE INDEX IF NOT EXISTS idx_guide_wallet_adjustments_guide_created
  ON public.guide_wallet_adjustments (guide_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guide_wallet_adjustments_admin_created
  ON public.guide_wallet_adjustments (admin_id, created_at DESC);

ALTER TABLE public.guide_wallet_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides and admins can view guide wallet adjustments" ON public.guide_wallet_adjustments;
CREATE POLICY "Guides and admins can view guide wallet adjustments"
  ON public.guide_wallet_adjustments FOR SELECT
  USING (auth.uid() = guide_id OR public.is_admin());

DROP FUNCTION IF EXISTS public.admin_adjust_pilgrim_wallet(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION public.admin_adjust_pilgrim_wallet(
  p_user_id UUID,
  p_amount_eur NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_role TEXT;
  v_before NUMERIC := 0;
  v_after NUMERIC := 0;
  v_abs_amount NUMERIC := 0;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur requis.';
  END IF;

  IF p_amount_eur IS NULL OR p_amount_eur = 0 THEN
    RAISE EXCEPTION 'Le montant doit être non nul.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = p_user_id
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable.';
  END IF;

  IF v_role <> 'pilgrim' THEN
    RAISE EXCEPTION 'Cette opération est réservée aux comptes pèlerins.';
  END IF;

  INSERT INTO public.pilgrim_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT available_balance
  INTO v_before
  FROM public.pilgrim_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_before := COALESCE(v_before, 0);
  v_after := ROUND((v_before + p_amount_eur)::numeric, 2);
  v_abs_amount := ROUND(ABS(p_amount_eur)::numeric, 2);

  IF v_after < 0 THEN
    RAISE EXCEPTION 'Le solde de cagnotte ne peut pas devenir négatif.';
  END IF;

  UPDATE public.pilgrim_wallets
  SET
    available_balance = v_after,
    total_credited = total_credited + CASE WHEN p_amount_eur > 0 THEN v_abs_amount ELSE 0 END,
    total_debited = total_debited + CASE WHEN p_amount_eur < 0 THEN v_abs_amount ELSE 0 END,
    updated_at = v_now
  WHERE user_id = p_user_id;

  INSERT INTO public.pilgrim_wallet_transactions (
    user_id,
    reservation_id,
    direction,
    type,
    amount,
    balance_before,
    balance_after,
    metadata
  )
  VALUES (
    p_user_id,
    NULL,
    CASE WHEN p_amount_eur > 0 THEN 'credit' ELSE 'debit' END,
    'admin_adjustment',
    v_abs_amount,
    v_before,
    v_after,
    jsonb_build_object(
      'source', 'admin_adjust_pilgrim_wallet',
      'adminId', v_admin_id,
      'reason', NULLIF(BTRIM(COALESCE(p_reason, '')), '')
    )
  );

  RETURN jsonb_build_object(
    'userId', p_user_id,
    'amountEur', ROUND(p_amount_eur::numeric, 2),
    'availableBalance', v_after
  );
END;
$$;

DROP FUNCTION IF EXISTS public.admin_add_guide_wallet_adjustment(UUID, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION public.admin_add_guide_wallet_adjustment(
  p_guide_id UUID,
  p_amount_eur NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role TEXT;
  v_due_base NUMERIC := 0;
  v_adjustments_sum NUMERIC := 0;
  v_resulting_balance NUMERIC := 0;
  v_adjustment_id UUID;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs.';
  END IF;

  IF p_guide_id IS NULL THEN
    RAISE EXCEPTION 'Guide requis.';
  END IF;

  IF p_amount_eur IS NULL OR p_amount_eur = 0 THEN
    RAISE EXCEPTION 'Le montant doit être non nul.';
  END IF;

  SELECT role
  INTO v_role
  FROM public.profiles
  WHERE id = p_guide_id
  LIMIT 1;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Guide introuvable.';
  END IF;

  IF v_role <> 'guide' THEN
    RAISE EXCEPTION 'Cette opération est réservée aux comptes guides.';
  END IF;

  SELECT COALESCE(SUM(COALESCE(guide_net_amount, COALESCE(total_price, 0) - COALESCE(platform_fee_amount, 0))), 0)
  INTO v_due_base
  FROM public.reservations
  WHERE guide_id = p_guide_id
    AND status = 'completed'
    AND payout_status IN ('to_pay', 'processing', 'failed');

  SELECT COALESCE(SUM(amount_eur), 0)
  INTO v_adjustments_sum
  FROM public.guide_wallet_adjustments
  WHERE guide_id = p_guide_id;

  v_resulting_balance := ROUND((v_due_base + v_adjustments_sum + p_amount_eur)::numeric, 2);
  IF v_resulting_balance < 0 THEN
    RAISE EXCEPTION 'L''ajustement rendrait la cagnotte guide négative.';
  END IF;

  INSERT INTO public.guide_wallet_adjustments (
    guide_id,
    admin_id,
    amount_eur,
    reason
  )
  VALUES (
    p_guide_id,
    v_admin_id,
    ROUND(p_amount_eur::numeric, 2),
    NULLIF(BTRIM(COALESCE(p_reason, '')), '')
  )
  RETURNING id INTO v_adjustment_id;

  RETURN jsonb_build_object(
    'adjustmentId', v_adjustment_id,
    'guideId', p_guide_id,
    'amountEur', ROUND(p_amount_eur::numeric, 2),
    'availableBalance', v_resulting_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_pilgrim_wallet(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_guide_wallet_adjustment(UUID, NUMERIC, TEXT) TO authenticated;
