-- Migration: Block solo female pilgrim bookings only with male guides
-- Date: 2026-04-10

CREATE OR REPLACE FUNCTION public.create_reservation_with_wallet(
  p_guide_id UUID,
  p_service_name TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_total_price NUMERIC,
  p_location TEXT,
  p_visit_time TEXT,
  p_pilgrims_names TEXT[],
  p_use_wallet BOOLEAN DEFAULT false,
  p_transport_pickup_type TEXT DEFAULT NULL,
  p_hotel_address TEXT DEFAULT NULL,
  p_hotel_over_2km_by_car BOOLEAN DEFAULT NULL,
  p_hotel_distance_km NUMERIC DEFAULT NULL,
  p_transport_extra_fee_amount NUMERIC DEFAULT 0,
  p_transport_warning_acknowledged BOOLEAN DEFAULT false,
  p_commissionable_net_amount NUMERIC DEFAULT NULL,
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
  v_total_price NUMERIC := GREATEST(COALESCE(p_total_price, 0), 0);
  v_wallet_before NUMERIC := 0;
  v_wallet_after NUMERIC := 0;
  v_wallet_used NUMERIC := 0;
  v_card_paid NUMERIC := 0;
  v_reservation public.reservations%ROWTYPE;
  v_role TEXT;
  v_gender TEXT;
  v_guide_gender TEXT;
  v_valid_pilgrims_count INTEGER := 0;
  v_transport_pickup_type TEXT;
  v_expected_transport_fee NUMERIC := 0;
  v_hotel_address TEXT := NULLIF(BTRIM(COALESCE(p_hotel_address, '')), '');
  v_commission_rate NUMERIC := 0.30;
  v_commissionable_net_amount NUMERIC := 0;
  v_expected_total NUMERIC := 0;
  v_platform_fee_amount NUMERIC := 0;
  v_guide_net_amount NUMERIC := 0;
  v_charter_version TEXT := NULLIF(BTRIM(COALESCE(p_pilgrim_charter_version, '')), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté.';
  END IF;

  IF p_guide_id IS NULL THEN
    RAISE EXCEPTION 'Guide requis.';
  END IF;

  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Dates de réservation invalides.';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin ne peut pas être avant la date de début.';
  END IF;

  IF COALESCE(p_pilgrim_charter_accepted, false) = false THEN
    RAISE EXCEPTION 'Vous devez accepter la Charte du Pèlerin avant de réserver.';
  END IF;

  IF v_charter_version IS NULL THEN
    RAISE EXCEPTION 'Version de charte invalide.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_blocks ub
    WHERE (ub.blocker_id = v_user_id AND ub.blocked_id = p_guide_id)
      OR (ub.blocker_id = p_guide_id AND ub.blocked_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Réservation impossible: un blocage existe entre vous et ce guide.';
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

  IF COALESCE(p_transport_extra_fee_amount, 0) <> v_expected_transport_fee THEN
    RAISE EXCEPTION 'Supplément transport incohérent. Attendu: %.', v_expected_transport_fee;
  END IF;

  v_commissionable_net_amount := ROUND(
    GREATEST(
      COALESCE(p_commissionable_net_amount, v_total_price - v_expected_transport_fee),
      0
    )::numeric,
    2
  );

  v_expected_total := ROUND((v_commissionable_net_amount + v_expected_transport_fee)::numeric, 2);
  IF ABS(v_total_price - v_expected_total) > 0.01 THEN
    RAISE EXCEPTION 'Montant total incohérent. Attendu: %.', v_expected_total;
  END IF;

  v_platform_fee_amount := ROUND((v_commissionable_net_amount * v_commission_rate)::numeric, 2);
  v_guide_net_amount := ROUND((v_total_price - v_platform_fee_amount)::numeric, 2);

  SELECT role, gender
  INTO v_role, v_gender
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  SELECT gender
  INTO v_guide_gender
  FROM public.profiles
  WHERE id = p_guide_id
  LIMIT 1;

  SELECT COUNT(*)
  INTO v_valid_pilgrims_count
  FROM unnest(COALESCE(p_pilgrims_names, ARRAY[]::TEXT[])) AS pilgrim_name
  WHERE NULLIF(BTRIM(pilgrim_name), '') IS NOT NULL;

  IF v_role = 'pilgrim'
    AND v_gender = 'female'
    AND v_guide_gender = 'male'
    AND v_valid_pilgrims_count < 2 THEN
    RAISE EXCEPTION 'Une femme ne peut pas réserver seule avec un guide homme. Ajoutez un pèlerin homme ou femme pour être au minimum deux.';
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

    v_wallet_used := LEAST(COALESCE(v_wallet_before, 0), v_total_price);

    IF v_wallet_used > 0 THEN
      v_wallet_after := COALESCE(v_wallet_before, 0) - v_wallet_used;

      UPDATE public.pilgrim_wallets
      SET
        available_balance = v_wallet_after,
        total_debited = total_debited + v_wallet_used,
        updated_at = v_now
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  v_card_paid := GREATEST(v_total_price - v_wallet_used, 0);

  INSERT INTO public.reservations (
    user_id,
    guide_id,
    service_name,
    start_date,
    end_date,
    total_price,
    location,
    visit_time,
    pilgrims_names,
    status,
    payout_status,
    wallet_amount_used,
    card_amount_paid,
    commission_rate,
    commissionable_net_amount,
    platform_fee_amount,
    guide_net_amount,
    transport_pickup_type,
    hotel_address,
    hotel_over_2km_by_car,
    hotel_distance_km,
    transport_extra_fee_amount,
    pilgrim_charter_accepted_at,
    pilgrim_charter_version,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_guide_id,
    p_service_name,
    p_start_date,
    p_end_date,
    v_total_price,
    p_location,
    p_visit_time,
    p_pilgrims_names,
    'pending',
    'not_due',
    v_wallet_used,
    v_card_paid,
    v_commission_rate,
    v_commissionable_net_amount,
    v_platform_fee_amount,
    v_guide_net_amount,
    v_transport_pickup_type,
    CASE WHEN v_transport_pickup_type = 'hotel' THEN v_hotel_address ELSE NULL END,
    CASE WHEN v_transport_pickup_type = 'hotel' THEN p_hotel_over_2km_by_car ELSE NULL END,
    CASE WHEN v_transport_pickup_type = 'hotel' AND p_hotel_over_2km_by_car THEN p_hotel_distance_km ELSE NULL END,
    v_expected_transport_fee,
    v_now,
    v_charter_version,
    v_now,
    v_now
  )
  RETURNING * INTO v_reservation;

  IF v_wallet_used > 0 THEN
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
      v_user_id,
      v_reservation.id,
      'debit',
      'booking_debit',
      v_wallet_used,
      COALESCE(v_wallet_before, 0),
      COALESCE(v_wallet_after, COALESCE(v_wallet_before, 0)),
      jsonb_build_object(
        'source', 'create_reservation_with_wallet',
        'serviceName', p_service_name,
        'guideId', p_guide_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'reservationId', v_reservation.id,
    'status', v_reservation.status,
    'walletAmountUsed', COALESCE(v_wallet_used, 0),
    'cardAmountPaid', COALESCE(v_card_paid, 0),
    'totalPrice', COALESCE(v_total_price, 0),
    'commissionableNetAmount', COALESCE(v_commissionable_net_amount, 0),
    'platformFeeAmount', COALESCE(v_platform_fee_amount, 0),
    'guideNetAmount', COALESCE(v_guide_net_amount, 0),
    'transportPickupType', v_reservation.transport_pickup_type,
    'transportExtraFeeAmount', COALESCE(v_reservation.transport_extra_fee_amount, 0),
    'pilgrimCharterAcceptedAt', v_reservation.pilgrim_charter_accepted_at,
    'pilgrimCharterVersion', v_reservation.pilgrim_charter_version
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation_with_wallet(
  UUID,
  TEXT,
  DATE,
  DATE,
  NUMERIC,
  TEXT,
  TEXT,
  TEXT[],
  BOOLEAN,
  TEXT,
  TEXT,
  BOOLEAN,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  NUMERIC,
  BOOLEAN,
  TEXT
) TO authenticated;

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
  v_guide_gender TEXT;
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

  SELECT gender
  INTO v_guide_gender
  FROM public.profiles
  WHERE id = p_guide_id
  LIMIT 1;

  SELECT COUNT(*)
  INTO v_valid_pilgrims_count
  FROM unnest(COALESCE(p_pilgrims_names, ARRAY[]::TEXT[])) AS pilgrim_name
  WHERE NULLIF(BTRIM(pilgrim_name), '') IS NOT NULL;

  IF v_role = 'pilgrim'
    AND v_gender = 'female'
    AND v_guide_gender = 'male'
    AND v_valid_pilgrims_count < 2 THEN
    RAISE EXCEPTION 'Une femme ne peut pas réserver seule avec un guide homme. Ajoutez un pèlerin homme ou femme pour être au minimum deux.';
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

GRANT EXECUTE ON FUNCTION public.prepare_stripe_checkout_session(
  UUID,
  UUID,
  TEXT,
  DATE,
  DATE,
  NUMERIC,
  TEXT,
  TEXT,
  TEXT[],
  TEXT,
  TEXT,
  BOOLEAN,
  NUMERIC,
  NUMERIC,
  BOOLEAN,
  BOOLEAN,
  BOOLEAN,
  TEXT
) TO authenticated;
