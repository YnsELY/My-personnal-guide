-- Migration: Stripe checkout RPC workflow (prepare/finalize/release/status)
-- Date: 2026-03-13

DROP FUNCTION IF EXISTS public.prepare_stripe_checkout_session(
  UUID, UUID, TEXT, DATE, DATE, NUMERIC, TEXT, TEXT, TEXT[], TEXT, TEXT, BOOLEAN, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, BOOLEAN, TEXT
);
DROP FUNCTION IF EXISTS public.finalize_stripe_checkout_session(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.release_stripe_checkout_wallet_hold(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_stripe_checkout_reservation_status(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.prepare_stripe_checkout_session(
  p_service_id UUID,
  p_guide_id UUID,
  p_service_name TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_total_price NUMERIC,
  p_location TEXT,
  p_visit_time TEXT,
  p_pilgrims_names TEXT[],
  p_transport_pickup_type TEXT,
  p_hotel_address TEXT DEFAULT NULL,
  p_hotel_over_2km_by_car BOOLEAN DEFAULT NULL,
  p_hotel_distance_km NUMERIC DEFAULT NULL,
  p_transport_extra_fee_amount NUMERIC DEFAULT 0,
  p_use_wallet BOOLEAN DEFAULT false,
  p_transport_warning_acknowledged BOOLEAN DEFAULT false,
  p_pilgrim_charter_accepted BOOLEAN DEFAULT false,
  p_pilgrim_charter_version TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_service public.services%ROWTYPE;
  v_role TEXT;
  v_gender TEXT;
  v_valid_pilgrims_count INTEGER := 0;
  v_transport_pickup_type TEXT;
  v_hotel_address TEXT := NULLIF(BTRIM(COALESCE(p_hotel_address, '')), '');
  v_expected_transport_fee NUMERIC := 0;
  v_total_price NUMERIC := ROUND(GREATEST(COALESCE(p_total_price, 0), 0)::numeric, 2);
  v_expected_total NUMERIC := 0;
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
  v_wallet_hold NUMERIC := 0;
  v_card_amount NUMERIC := 0;
  v_charter_version TEXT := NULLIF(BTRIM(COALESCE(p_pilgrim_charter_version, '')), '');
  v_pending_id UUID;
  v_pilgrims TEXT[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_service_id IS NULL OR p_guide_id IS NULL THEN
    RAISE EXCEPTION 'Service et guide requis.';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Dates de réservation invalides.';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin ne peut pas être avant la date de début.';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_visit_time, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Heure de visite requise.';
  END IF;

  IF COALESCE(p_pilgrim_charter_accepted, false) = false THEN
    RAISE EXCEPTION 'Vous devez accepter la Charte du Pèlerin avant de réserver.';
  END IF;

  IF v_charter_version IS NULL THEN
    RAISE EXCEPTION 'Version de charte invalide.';
  END IF;

  SELECT *
  INTO v_service
  FROM public.services
  WHERE id = p_service_id
    AND guide_id = p_guide_id
    AND (service_status = 'active' OR service_status IS NULL)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service introuvable ou indisponible.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_blocks ub
    WHERE (ub.blocker_id = v_user_id AND ub.blocked_id = p_guide_id)
      OR (ub.blocker_id = p_guide_id AND ub.blocked_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Réservation impossible: un blocage existe entre vous et ce guide.';
  END IF;

  SELECT role, gender
  INTO v_role, v_gender
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  SELECT COUNT(*)
  INTO v_valid_pilgrims_count
  FROM unnest(COALESCE(p_pilgrims_names, ARRAY[]::TEXT[])) AS pilgrim_name
  WHERE NULLIF(BTRIM(pilgrim_name), '') IS NOT NULL;

  IF v_role = 'pilgrim'
    AND v_gender = 'female'
    AND v_valid_pilgrims_count < 2 THEN
    RAISE EXCEPTION 'Pour un compte femme, ajoutez au moins un deuxième pèlerin.';
  END IF;

  v_transport_pickup_type := LOWER(NULLIF(BTRIM(COALESCE(p_transport_pickup_type, '')), ''));
  IF v_transport_pickup_type IS NULL OR v_transport_pickup_type NOT IN ('haram', 'hotel') THEN
    RAISE EXCEPTION 'Type de transport invalide. Choisissez haram ou hotel.';
  END IF;

  IF v_transport_pickup_type = 'haram' THEN
    v_expected_transport_fee := 0;
  ELSE
    IF v_hotel_address IS NULL THEN
      RAISE EXCEPTION 'Adresse de l''hôtel requise.';
    END IF;

    IF p_hotel_over_2km_by_car IS NULL THEN
      RAISE EXCEPTION 'Veuillez préciser si l''hôtel est à plus de 2 km en voiture.';
    END IF;

    IF p_hotel_over_2km_by_car THEN
      IF p_hotel_distance_km IS NULL OR p_hotel_distance_km <= 2 THEN
        RAISE EXCEPTION 'La distance de l''hôtel doit être strictement supérieure à 2 km.';
      END IF;
      v_expected_transport_fee := 10;
    ELSE
      IF p_hotel_distance_km IS NOT NULL THEN
        RAISE EXCEPTION 'Ne renseignez pas de distance si l''hôtel est à 2 km ou moins.';
      END IF;
      IF COALESCE(p_transport_warning_acknowledged, false) = false THEN
        RAISE EXCEPTION 'Vous devez confirmer l''avertissement transport.';
      END IF;
      v_expected_transport_fee := 0;
    END IF;
  END IF;

  IF ROUND(COALESCE(p_transport_extra_fee_amount, 0)::numeric, 2) <> v_expected_transport_fee THEN
    RAISE EXCEPTION 'Supplément transport incohérent. Attendu: %.', v_expected_transport_fee;
  END IF;

  v_expected_total := ROUND((GREATEST(COALESCE(v_service.price_override, 0), 0) + v_expected_transport_fee)::numeric, 2);
  IF ABS(v_total_price - v_expected_total) > 0.01 THEN
    RAISE EXCEPTION 'Montant total incohérent. Attendu: %.', v_expected_total;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE r.guide_id = p_guide_id
      AND r.start_date = p_start_date
      AND r.visit_time = p_visit_time
      AND r.status IN ('pending', 'confirmed', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Créneau indisponible.';
  END IF;

  INSERT INTO public.pilgrim_wallets (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF COALESCE(p_use_wallet, false) THEN
    SELECT available_balance
    INTO v_wallet_before
    FROM public.pilgrim_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_wallet_hold := LEAST(COALESCE(v_wallet_before, 0), v_total_price);

    IF v_wallet_hold > 0 THEN
      v_wallet_after := COALESCE(v_wallet_before, 0) - v_wallet_hold;

      UPDATE public.pilgrim_wallets
      SET
        available_balance = v_wallet_after,
        total_debited = total_debited + v_wallet_hold,
        updated_at = v_now
      WHERE user_id = v_user_id;

      INSERT INTO public.pilgrim_wallet_transactions (
        user_id,
        direction,
        type,
        amount,
        balance_before,
        balance_after,
        metadata
      )
      VALUES (
        v_user_id,
        'debit',
        'checkout_wallet_hold',
        v_wallet_hold,
        COALESCE(v_wallet_before, 0),
        v_wallet_after,
        jsonb_build_object(
          'source', 'prepare_stripe_checkout_session',
          'serviceId', p_service_id,
          'guideId', p_guide_id
        )
      );
    END IF;
  END IF;

  v_card_amount := ROUND(GREATEST(v_total_price - v_wallet_hold, 0)::numeric, 2);
  IF v_card_amount <= 0 THEN
    RAISE EXCEPTION 'Aucun montant carte à payer. Utilisez la cagnotte.';
  END IF;

  v_pilgrims := COALESCE(p_pilgrims_names, ARRAY[]::TEXT[]);

  INSERT INTO public.stripe_checkout_sessions (
    user_id,
    guide_id,
    service_id,
    reservation_payload,
    currency,
    total_amount,
    wallet_hold_amount,
    card_amount,
    status,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_guide_id,
    p_service_id,
    jsonb_build_object(
      'guideId', p_guide_id,
      'serviceId', p_service_id,
      'serviceName', COALESCE(NULLIF(BTRIM(COALESCE(p_service_name, '')), ''), COALESCE(v_service.category, v_service.title)),
      'startDate', p_start_date,
      'endDate', p_end_date,
      'totalPrice', v_total_price,
      'location', p_location,
      'visitTime', p_visit_time,
      'pilgrims', to_jsonb(v_pilgrims),
      'transportPickupType', v_transport_pickup_type,
      'hotelAddress', v_hotel_address,
      'hotelOver2KmByCar', p_hotel_over_2km_by_car,
      'hotelDistanceKm', p_hotel_distance_km,
      'transportExtraFeeAmount', v_expected_transport_fee,
      'commissionableNetAmount', GREATEST(COALESCE(v_service.price_override, 0), 0),
      'pilgrimCharterVersion', v_charter_version,
      'transportWarningAcknowledged', COALESCE(p_transport_warning_acknowledged, false)
    ),
    'eur',
    v_total_price,
    v_wallet_hold,
    v_card_amount,
    'pending',
    (v_now + INTERVAL '30 minutes'),
    v_now,
    v_now
  )
  RETURNING id INTO v_pending_id;

  RETURN jsonb_build_object(
    'pendingCheckoutId', v_pending_id,
    'status', 'pending',
    'walletHoldAmount', v_wallet_hold,
    'cardAmount', v_card_amount,
    'totalAmount', v_total_price,
    'currency', 'eur'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_stripe_checkout_session(
  p_pending_checkout_id UUID DEFAULT NULL,
  p_checkout_session_id TEXT DEFAULT NULL,
  p_payment_intent_id TEXT DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_checkout public.stripe_checkout_sessions%ROWTYPE;
  v_payload JSONB;
  v_created JSONB;
  v_reservation_id UUID;
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
  v_pilgrims TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Acces reserve au service backend.';
  END IF;

  IF p_pending_checkout_id IS NULL AND NULLIF(BTRIM(COALESCE(p_checkout_session_id, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Checkout requis.';
  END IF;

  SELECT *
  INTO v_checkout
  FROM public.stripe_checkout_sessions
  WHERE (p_pending_checkout_id IS NOT NULL AND id = p_pending_checkout_id)
     OR (NULLIF(BTRIM(COALESCE(p_checkout_session_id, '')), '') IS NOT NULL AND checkout_session_id = p_checkout_session_id)
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout en attente introuvable.';
  END IF;

  IF v_checkout.status IN ('finalized', 'conflict_credited') THEN
    RETURN jsonb_build_object(
      'status', v_checkout.status,
      'pendingCheckoutId', v_checkout.id,
      'reservationId', v_checkout.reservation_id
    );
  END IF;

  IF v_checkout.status IN ('failed', 'cancelled', 'expired') THEN
    RETURN jsonb_build_object(
      'status', v_checkout.status,
      'pendingCheckoutId', v_checkout.id,
      'reservationId', v_checkout.reservation_id,
      'message', 'Checkout non finalisable.'
    );
  END IF;

  UPDATE public.stripe_checkout_sessions
  SET
    status = 'paid',
    payment_intent_id = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_intent_id, '')), ''), payment_intent_id),
    updated_at = v_now
  WHERE id = v_checkout.id;

  v_payload := v_checkout.reservation_payload;
  SELECT COALESCE(ARRAY_AGG(value), ARRAY[]::TEXT[])
  INTO v_pilgrims
  FROM jsonb_array_elements_text(COALESCE(v_payload->'pilgrims', '[]'::jsonb)) AS value;

  BEGIN
    SELECT public.create_reservation_with_wallet(
      (v_payload->>'guideId')::UUID,
      COALESCE(v_payload->>'serviceName', 'Service'),
      (v_payload->>'startDate')::DATE,
      (v_payload->>'endDate')::DATE,
      COALESCE((v_payload->>'totalPrice')::NUMERIC, v_checkout.total_amount),
      v_payload->>'location',
      v_payload->>'visitTime',
      v_pilgrims,
      false,
      v_payload->>'transportPickupType',
      NULLIF(v_payload->>'hotelAddress', ''),
      CASE
        WHEN v_payload ? 'hotelOver2KmByCar' THEN (v_payload->>'hotelOver2KmByCar')::BOOLEAN
        ELSE NULL
      END,
      CASE
        WHEN NULLIF(v_payload->>'hotelDistanceKm', '') IS NOT NULL THEN (v_payload->>'hotelDistanceKm')::NUMERIC
        ELSE NULL
      END,
      COALESCE((v_payload->>'transportExtraFeeAmount')::NUMERIC, 0),
      COALESCE((v_payload->>'transportWarningAcknowledged')::BOOLEAN, false),
      COALESCE((v_payload->>'commissionableNetAmount')::NUMERIC, 0),
      true,
      COALESCE(v_payload->>'pilgrimCharterVersion', 'pilgrim_charter_v1_2026-03')
    )
    INTO v_created;

    v_reservation_id := (v_created->>'reservationId')::UUID;

    UPDATE public.reservations
    SET
      wallet_amount_used = COALESCE(v_checkout.wallet_hold_amount, 0),
      card_amount_paid = COALESCE(v_checkout.card_amount, 0),
      stripe_checkout_session_id = COALESCE(v_checkout.checkout_session_id, p_checkout_session_id),
      stripe_payment_intent_id = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_intent_id, '')), ''), stripe_payment_intent_id),
      payment_status = 'paid',
      updated_at = v_now
    WHERE id = v_reservation_id;

    UPDATE public.stripe_checkout_sessions
    SET
      status = 'finalized',
      reservation_id = v_reservation_id,
      finalized_at = v_now,
      payment_intent_id = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_intent_id, '')), ''), payment_intent_id),
      updated_at = v_now
    WHERE id = v_checkout.id;

    RETURN jsonb_build_object(
      'status', 'finalized',
      'pendingCheckoutId', v_checkout.id,
      'reservationId', v_reservation_id
    );

  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.pilgrim_wallets (user_id)
    VALUES (v_checkout.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT available_balance
    INTO v_wallet_before
    FROM public.pilgrim_wallets
    WHERE user_id = v_checkout.user_id
    FOR UPDATE;

    v_wallet_after := COALESCE(v_wallet_before, 0) + COALESCE(v_checkout.wallet_hold_amount, 0) + COALESCE(v_checkout.card_amount, 0);

    UPDATE public.pilgrim_wallets
    SET
      available_balance = v_wallet_after,
      total_credited = total_credited + COALESCE(v_checkout.wallet_hold_amount, 0) + COALESCE(v_checkout.card_amount, 0),
      updated_at = v_now
    WHERE user_id = v_checkout.user_id;

    IF COALESCE(v_checkout.wallet_hold_amount, 0) > 0 THEN
      INSERT INTO public.pilgrim_wallet_transactions (
        user_id,
        direction,
        type,
        amount,
        balance_before,
        balance_after,
        metadata
      )
      VALUES (
        v_checkout.user_id,
        'credit',
        'checkout_wallet_release',
        v_checkout.wallet_hold_amount,
        COALESCE(v_wallet_before, 0),
        COALESCE(v_wallet_before, 0) + v_checkout.wallet_hold_amount,
        jsonb_build_object(
          'source', 'finalize_stripe_checkout_session',
          'reason', 'slot_conflict_release_hold',
          'pendingCheckoutId', v_checkout.id,
          'eventId', p_event_id
        )
      );
    END IF;

    IF COALESCE(v_checkout.card_amount, 0) > 0 THEN
      INSERT INTO public.pilgrim_wallet_transactions (
        user_id,
        direction,
        type,
        amount,
        balance_before,
        balance_after,
        metadata
      )
      VALUES (
        v_checkout.user_id,
        'credit',
        'checkout_conflict_credit',
        v_checkout.card_amount,
        COALESCE(v_wallet_before, 0) + COALESCE(v_checkout.wallet_hold_amount, 0),
        v_wallet_after,
        jsonb_build_object(
          'source', 'finalize_stripe_checkout_session',
          'reason', 'slot_conflict_card_credit',
          'pendingCheckoutId', v_checkout.id,
          'eventId', p_event_id
        )
      );
    END IF;

    UPDATE public.stripe_checkout_sessions
    SET
      status = 'conflict_credited',
      failure_reason = 'CRENEAU_DEJA_PRIS',
      payment_intent_id = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_intent_id, '')), ''), payment_intent_id),
      updated_at = v_now,
      finalized_at = v_now
    WHERE id = v_checkout.id;

    RETURN jsonb_build_object(
      'status', 'conflict_credited',
      'pendingCheckoutId', v_checkout.id,
      'message', 'Créneau déjà pris, montant crédité en cagnotte.'
    );

  WHEN OTHERS THEN
    IF COALESCE(v_checkout.wallet_hold_amount, 0) > 0 THEN
      INSERT INTO public.pilgrim_wallets (user_id)
      VALUES (v_checkout.user_id)
      ON CONFLICT (user_id) DO NOTHING;

      SELECT available_balance
      INTO v_wallet_before
      FROM public.pilgrim_wallets
      WHERE user_id = v_checkout.user_id
      FOR UPDATE;

      v_wallet_after := COALESCE(v_wallet_before, 0) + COALESCE(v_checkout.wallet_hold_amount, 0);

      UPDATE public.pilgrim_wallets
      SET
        available_balance = v_wallet_after,
        total_credited = total_credited + COALESCE(v_checkout.wallet_hold_amount, 0),
        updated_at = v_now
      WHERE user_id = v_checkout.user_id;

      INSERT INTO public.pilgrim_wallet_transactions (
        user_id,
        direction,
        type,
        amount,
        balance_before,
        balance_after,
        metadata
      )
      VALUES (
        v_checkout.user_id,
        'credit',
        'checkout_wallet_release',
        v_checkout.wallet_hold_amount,
        COALESCE(v_wallet_before, 0),
        v_wallet_after,
        jsonb_build_object(
          'source', 'finalize_stripe_checkout_session',
          'reason', 'finalization_failed_release_hold',
          'pendingCheckoutId', v_checkout.id,
          'eventId', p_event_id
        )
      );
    END IF;

    UPDATE public.stripe_checkout_sessions
    SET
      status = 'failed',
      failure_reason = LEFT(SQLERRM, 300),
      payment_intent_id = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_intent_id, '')), ''), payment_intent_id),
      updated_at = v_now
    WHERE id = v_checkout.id;

    RETURN jsonb_build_object(
      'status', 'failed',
      'pendingCheckoutId', v_checkout.id,
      'message', LEFT(SQLERRM, 300)
    );
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_stripe_checkout_wallet_hold(
  p_pending_checkout_id UUID DEFAULT NULL,
  p_checkout_session_id TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT 'cancelled',
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := NOW();
  v_checkout public.stripe_checkout_sessions%ROWTYPE;
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
  v_status TEXT := LOWER(NULLIF(BTRIM(COALESCE(p_new_status, '')), ''));
BEGIN
  IF v_status IS NULL OR v_status NOT IN ('failed', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Statut invalide.';
  END IF;

  SELECT *
  INTO v_checkout
  FROM public.stripe_checkout_sessions
  WHERE (p_pending_checkout_id IS NOT NULL AND id = p_pending_checkout_id)
     OR (NULLIF(BTRIM(COALESCE(p_checkout_session_id, '')), '') IS NOT NULL AND checkout_session_id = p_checkout_session_id)
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout introuvable.';
  END IF;

  IF auth.role() <> 'service_role' THEN
    IF v_user_id IS NULL OR v_user_id <> v_checkout.user_id THEN
      RAISE EXCEPTION 'Acces refuse.';
    END IF;
  END IF;

  IF v_checkout.status IN ('finalized', 'conflict_credited') THEN
    RETURN jsonb_build_object(
      'status', v_checkout.status,
      'pendingCheckoutId', v_checkout.id,
      'message', 'Checkout déjà finalisé.'
    );
  END IF;

  IF v_checkout.status IN ('failed', 'cancelled', 'expired') THEN
    RETURN jsonb_build_object(
      'status', v_checkout.status,
      'pendingCheckoutId', v_checkout.id
    );
  END IF;

  IF COALESCE(v_checkout.wallet_hold_amount, 0) > 0 THEN
    INSERT INTO public.pilgrim_wallets (user_id)
    VALUES (v_checkout.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT available_balance
    INTO v_wallet_before
    FROM public.pilgrim_wallets
    WHERE user_id = v_checkout.user_id
    FOR UPDATE;

    v_wallet_after := COALESCE(v_wallet_before, 0) + v_checkout.wallet_hold_amount;

    UPDATE public.pilgrim_wallets
    SET
      available_balance = v_wallet_after,
      total_credited = total_credited + v_checkout.wallet_hold_amount,
      updated_at = v_now
    WHERE user_id = v_checkout.user_id;

    INSERT INTO public.pilgrim_wallet_transactions (
      user_id,
      direction,
      type,
      amount,
      balance_before,
      balance_after,
      metadata
    )
    VALUES (
      v_checkout.user_id,
      'credit',
      'checkout_wallet_release',
      v_checkout.wallet_hold_amount,
      COALESCE(v_wallet_before, 0),
      v_wallet_after,
      jsonb_build_object(
        'source', 'release_stripe_checkout_wallet_hold',
        'pendingCheckoutId', v_checkout.id,
        'reason', COALESCE(NULLIF(BTRIM(COALESCE(p_reason, '')), ''), v_status)
      )
    );
  END IF;

  UPDATE public.stripe_checkout_sessions
  SET
    status = v_status,
    failure_reason = COALESCE(NULLIF(BTRIM(COALESCE(p_reason, '')), ''), failure_reason),
    updated_at = v_now
  WHERE id = v_checkout.id;

  RETURN jsonb_build_object(
    'status', v_status,
    'pendingCheckoutId', v_checkout.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_stripe_checkout_reservation_status(
  p_pending_checkout_id UUID DEFAULT NULL,
  p_checkout_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_checkout public.stripe_checkout_sessions%ROWTYPE;
  v_message TEXT := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  SELECT *
  INTO v_checkout
  FROM public.stripe_checkout_sessions
  WHERE user_id = v_user_id
    AND (
      (p_pending_checkout_id IS NOT NULL AND id = p_pending_checkout_id)
      OR (NULLIF(BTRIM(COALESCE(p_checkout_session_id, '')), '') IS NOT NULL AND checkout_session_id = p_checkout_session_id)
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout introuvable.';
  END IF;

  IF v_checkout.status = 'conflict_credited' THEN
    v_message := 'Créneau indisponible, montant crédité en cagnotte.';
  ELSIF v_checkout.status IN ('failed', 'cancelled', 'expired') THEN
    v_message := COALESCE(v_checkout.failure_reason, 'Paiement non finalisé.');
  END IF;

  RETURN jsonb_build_object(
    'pendingCheckoutId', v_checkout.id,
    'checkoutSessionId', v_checkout.checkout_session_id,
    'status', v_checkout.status,
    'reservationId', v_checkout.reservation_id,
    'message', v_message
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.prepare_stripe_checkout_session(
  UUID, UUID, TEXT, DATE, DATE, NUMERIC, TEXT, TEXT, TEXT[], TEXT, TEXT, BOOLEAN, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, BOOLEAN, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.finalize_stripe_checkout_session(UUID, TEXT, TEXT, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.release_stripe_checkout_wallet_hold(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_stripe_checkout_reservation_status(UUID, TEXT) TO authenticated;
