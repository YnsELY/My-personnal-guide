// @ts-nocheck
import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const normalize = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const resolveServiceCode = (params: { title?: string; category?: string; location?: string }) => {
  const text = `${normalize(params.title)} ${normalize(params.category)}`.trim();
  const titleOnly = normalize(params.title);
  const location = normalize(params.location);

  const isBadal = text.includes('badal');
  const isPmr = text.includes('pmr') || text.includes('mobilite reduite') || text.includes('pousseur');
  const isRamadan = text.includes('ramadan') && !text.includes('hors ramadan');
  const isVisite = text.includes('visite');
  const isOmra2 = text.includes('2eme') && text.includes('omra');
  const isOmra = text.includes('omra');
  const isSolo = text.includes('seul') || text.includes('couple');
  const isFamille = text.includes('famille') || text.includes('3 a 7');
  const isGroupe = text.includes('groupe');

  if (isBadal) return isRamadan ? 'BADAL_RAMADAN' : 'BADAL_HORS';
  if (isPmr) return isRamadan ? 'PMR_RAMADAN' : 'PMR_HORS';

  if (isVisite) {
    if (location.includes('medine')) return 'VISITE_MEDINE';
    if (location.includes('makkah') || location.includes('mecque')) return 'VISITE_MAKKAH';
    if (titleOnly.includes('medine')) return 'VISITE_MEDINE';
    if (titleOnly.includes('makkah') || titleOnly.includes('mecque') || titleOnly.includes('mekkah')) return 'VISITE_MAKKAH';
    return null;
  }

  if (isOmra2) {
    if (isSolo) return isRamadan ? 'OMRA2_SOLO_RAMADAN' : 'OMRA2_SOLO_HORS';
    if (isFamille) return isRamadan ? 'OMRA2_FAMILLE_RAMADAN' : 'OMRA2_FAMILLE_HORS';
    if (isGroupe) return isRamadan ? 'OMRA2_GROUPE_RAMADAN' : 'OMRA2_GROUPE_HORS';
  }

  if (isOmra) {
    if (isSolo) return isRamadan ? 'OMRA_SOLO_RAMADAN' : 'OMRA_SOLO_HORS';
    if (isFamille) return isRamadan ? 'OMRA_FAMILLE_RAMADAN' : 'OMRA_FAMILLE_HORS';
    if (isGroupe) return isRamadan ? 'OMRA_GROUPE_RAMADAN' : 'OMRA_GROUPE_HORS';
  }

  return null;
};

const appendParams = (baseUrl: string, params: Record<string, string>) => {
  try {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const qs = new URLSearchParams(params).toString();
    return `${baseUrl}${separator}${qs}`;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('EXPO_STRIPE_SECRET_KEY') || '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !stripeSecretKey) {
    return new Response(JSON.stringify({ error: 'Missing required environment variables.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Invalid authorization header.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let pendingCheckoutId: string | null = null;

  try {
    const {
      serviceId,
      guideId,
      serviceName,
      startDate,
      endDate,
      totalPrice,
      location,
      visitTime,
      pilgrims,
      transportPickupType,
      hotelAddress,
      hotelOver2KmByCar,
      hotelDistanceKm,
      transportExtraFeeAmount,
      transportWarningAcknowledged,
      useWallet,
      pilgrimCharterAccepted,
      pilgrimCharterVersion,
      successUrl,
      cancelUrl,
    } = await req.json();

    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!serviceId || !guideId || !startDate || !visitTime || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: serviceRow, error: serviceError } = await adminClient
      .from('services')
      .select('id, guide_id, title, category, location, price_override, service_status')
      .eq('id', serviceId)
      .eq('guide_id', guideId)
      .single();

    if (serviceError || !serviceRow) {
      return new Response(JSON.stringify({ error: 'Service introuvable.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (serviceRow.service_status && serviceRow.service_status !== 'active') {
      return new Response(JSON.stringify({ error: 'Service indisponible.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceCode = resolveServiceCode({
      title: serviceRow.title,
      category: serviceRow.category,
      location: serviceRow.location,
    });

    const { data: preparedRaw, error: prepareError } = await userClient.rpc('prepare_stripe_checkout_session', {
      p_service_id: serviceId,
      p_guide_id: guideId,
      p_service_name: serviceName || `${serviceRow.category || serviceRow.title}`,
      p_start_date: String(startDate).slice(0, 10),
      p_end_date: String(endDate || startDate).slice(0, 10),
      p_total_price: Number(totalPrice || 0),
      p_location: location || null,
      p_visit_time: visitTime || null,
      p_pilgrims_names: Array.isArray(pilgrims) ? pilgrims : [],
      p_transport_pickup_type: transportPickupType || null,
      p_hotel_address: hotelAddress || null,
      p_hotel_over_2km_by_car: hotelOver2KmByCar === null || hotelOver2KmByCar === undefined ? null : !!hotelOver2KmByCar,
      p_hotel_distance_km: hotelDistanceKm === null || hotelDistanceKm === undefined || hotelDistanceKm === '' ? null : Number(hotelDistanceKm),
      p_transport_extra_fee_amount: Number(transportExtraFeeAmount || 0),
      p_use_wallet: !!useWallet,
      p_transport_warning_acknowledged: transportPickupType === 'hotel'
        ? (hotelOver2KmByCar === false ? !!transportWarningAcknowledged : true)
        : true,
      p_pilgrim_charter_accepted: !!pilgrimCharterAccepted,
      p_pilgrim_charter_version: pilgrimCharterVersion || null,
    });

    if (prepareError) {
      return new Response(JSON.stringify({ error: prepareError.message || 'Unable to prepare checkout.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prepared = Array.isArray(preparedRaw) ? preparedRaw[0] : preparedRaw;
    pendingCheckoutId = prepared?.pendingCheckoutId || prepared?.pending_checkout_id || null;
    const walletHoldAmount = Number(prepared?.walletHoldAmount || prepared?.wallet_hold_amount || 0);
    const cardAmount = Number(prepared?.cardAmount || prepared?.card_amount || 0);
    const preparedTotalAmount = Number(prepared?.totalAmount || prepared?.total_amount || 0);

    if (!pendingCheckoutId || !Number.isFinite(cardAmount) || cardAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid prepared checkout payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const successUrlWithParams = appendParams(successUrl, {
      pendingCheckoutId,
      checkoutSessionId: '{CHECKOUT_SESSION_ID}',
      status: 'success',
    });
    const cancelUrlWithParams = appendParams(cancelUrl, {
      pendingCheckoutId,
      checkoutSessionId: '{CHECKOUT_SESSION_ID}',
      status: 'cancel',
    });

    const transportAmount = Number(transportExtraFeeAmount || 0);
    const serviceAmount = Math.max(preparedTotalAmount - transportAmount, 0);

    if (!Number.isFinite(serviceAmount) || serviceAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid service amount for checkout.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(serviceAmount * 100),
          product_data: {
            name: String(serviceRow.title || serviceName || 'Prestation guide'),
            description: String(serviceRow.title || serviceName || ''),
          },
        },
        quantity: 1,
      },
    ];

    if (transportAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(transportAmount * 100),
          product_data: {
            name: 'Supplément transport (>2 km)',
          },
        },
        quantity: 1,
      });
    }

    let discounts: any[] | undefined;
    if (walletHoldAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(walletHoldAmount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Nefsy Wallet Hold ${pendingCheckoutId}`,
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrlWithParams,
      cancel_url: cancelUrlWithParams,
      line_items: lineItems,
      discounts,
      metadata: {
        pendingCheckoutId,
        userId: authData.user.id,
        guideId: String(guideId),
        serviceId: String(serviceId),
      },
      payment_intent_data: {
        metadata: {
          pendingCheckoutId,
          userId: authData.user.id,
          guideId: String(guideId),
          serviceId: String(serviceId),
        },
      },
      client_reference_id: pendingCheckoutId,
    });

    if (!session.url) {
      throw new Error('Stripe checkout URL missing.');
    }

    const { error: updateError } = await adminClient
      .from('stripe_checkout_sessions')
      .update({
        checkout_session_id: session.id,
        service_code: serviceCode,
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingCheckoutId);

    if (updateError) {
      throw new Error(updateError.message || 'Unable to persist checkout session id.');
    }

    return new Response(JSON.stringify({
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      pendingCheckoutId,
      cardAmount,
      walletHoldAmount,
      serviceCode,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    if (pendingCheckoutId) {
      try {
        await adminClient.rpc('release_stripe_checkout_wallet_hold', {
          p_pending_checkout_id: pendingCheckoutId,
          p_checkout_session_id: null,
          p_new_status: 'failed',
          p_reason: 'checkout_session_creation_failed',
        });
      } catch (releaseError) {
        console.error('Failed to release wallet hold after checkout creation failure', releaseError);
      }
    }

    return new Response(JSON.stringify({ error: error?.message || 'Unable to create checkout session.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
