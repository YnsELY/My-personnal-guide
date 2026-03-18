// @ts-nocheck
import Stripe from 'https://esm.sh/stripe@14.25.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const extractReservationId = (event: any) => {
  const obj = event?.data?.object || {};
  return (
    obj?.metadata?.reservationId ||
    obj?.metadata?.reservation_id ||
    obj?.client_reference_id ||
    null
  );
};

const extractPendingCheckoutId = (event: any) => {
  const obj = event?.data?.object || {};
  return (
    obj?.metadata?.pendingCheckoutId ||
    obj?.metadata?.pending_checkout_id ||
    obj?.client_reference_id ||
    null
  );
};

const extractCheckoutSessionId = (event: any) => {
  const obj = event?.data?.object || {};
  if (event?.type?.startsWith('checkout.session.')) return obj?.id || null;
  return obj?.checkout_session || obj?.metadata?.checkoutSessionId || null;
};

const extractPaymentIntentId = (event: any) => {
  const obj = event?.data?.object || {};
  if (event?.type?.startsWith('payment_intent.')) return obj?.id || null;
  if (typeof obj?.payment_intent === 'string') return obj.payment_intent;
  if (obj?.payment_intent?.id) return obj.payment_intent.id;
  return null;
};

const statusFromFailureEvent = (eventType: string) => {
  if (eventType === 'checkout.session.expired') return 'expired';
  return 'failed';
};

const shouldFinalize = (eventType: string) =>
  eventType === 'checkout.session.completed'
  || eventType === 'checkout.session.async_payment_succeeded'
  || eventType === 'payment_intent.succeeded';

const shouldRelease = (eventType: string) =>
  eventType === 'checkout.session.async_payment_failed'
  || eventType === 'payment_intent.payment_failed'
  || eventType === 'checkout.session.expired';

const shouldLogOnly = (eventType: string) =>
  eventType === 'charge.refunded';

const isTableMissing = (error: any, tableName: string) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || message.includes(`relation "${tableName.toLowerCase()}" does not exist`);
};

const isFunctionMissing = (error: any, functionName: string) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes(`function ${functionName.toLowerCase()}`) && message.includes('does not exist');
};

const asObject = (value: any) => (Array.isArray(value) ? value[0] : value);

const truncate = (value: string, max = 280) => (value.length > max ? `${value.slice(0, max)}...` : value);

const withJson = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  try {
    const stripeSecretKey =
      Deno.env.get('STRIPE_SECRET_KEY') ||
      Deno.env.get('EXPO_STRIPE_SECRET_KEY') ||
      '';
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing required environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.text();

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    let event: any;
    try {
      event = await stripe.webhooks.constructEventAsync(
        payload,
        signature,
        stripeWebhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (verificationError) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Optional idempotency/logging table:
    // create table public.stripe_webhook_events (
    //   id uuid default gen_random_uuid() primary key,
    //   event_id text unique not null,
    //   event_type text not null,
    //   reservation_id uuid null,
    //   payload jsonb not null,
    //   processed_at timestamptz not null default now()
    // );
    const pendingCheckoutId = extractPendingCheckoutId(event);
    const checkoutSessionId = extractCheckoutSessionId(event);
    const paymentIntentId = extractPaymentIntentId(event);
    const reservationId = extractReservationId(event);

    const { data: existingEvent, error: existingEventError } = await admin
      .from('stripe_webhook_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEventError && !isTableMissing(existingEventError, 'stripe_webhook_events')) {
      console.error('stripe_webhook_events duplicate check failed', existingEventError);
    }

    if (existingEvent?.id) {
      return withJson({ received: true, duplicate: true, eventId: event.id, type: event.type }, 200);
    }

    const eventRow = {
      event_id: event.id,
      event_type: event.type,
      checkout_session_id: checkoutSessionId,
      reservation_id: reservationId,
      payload: event,
      processed_at: new Date().toISOString(),
    };

    const { error: insertEventError } = await admin
      .from('stripe_webhook_events')
      .insert(eventRow);

    if (insertEventError && !isTableMissing(insertEventError, 'stripe_webhook_events')) {
      console.error('stripe_webhook_events insert failed', insertEventError);
    }

    let processingResult: any = null;

    if (shouldFinalize(event.type)) {
      const { data, error } = await admin.rpc('finalize_stripe_checkout_session', {
        p_pending_checkout_id: pendingCheckoutId,
        p_checkout_session_id: checkoutSessionId,
        p_payment_intent_id: paymentIntentId,
        p_event_id: event.id,
      });

      if (error && !isFunctionMissing(error, 'finalize_stripe_checkout_session')) {
        console.error('finalize_stripe_checkout_session failed', error);
        return withJson({ error: truncate(error.message || 'Finalize failed.') }, 500);
      }

      processingResult = asObject(data);
    } else if (shouldRelease(event.type)) {
      const { data, error } = await admin.rpc('release_stripe_checkout_wallet_hold', {
        p_pending_checkout_id: pendingCheckoutId,
        p_checkout_session_id: checkoutSessionId,
        p_new_status: statusFromFailureEvent(event.type),
        p_reason: event.type,
      });

      if (error && !isFunctionMissing(error, 'release_stripe_checkout_wallet_hold')) {
        console.error('release_stripe_checkout_wallet_hold failed', error);
        return withJson({ error: truncate(error.message || 'Release failed.') }, 500);
      }

      processingResult = asObject(data);
    } else if (shouldLogOnly(event.type)) {
      processingResult = { status: 'logged_only' };
    } else {
      processingResult = { status: 'ignored' };
    }

    const resolvedReservationId = processingResult?.reservationId || processingResult?.reservation_id || reservationId || null;
    if (resolvedReservationId) {
      const { error: updateEventReservationError } = await admin
        .from('stripe_webhook_events')
        .update({ reservation_id: resolvedReservationId })
        .eq('event_id', event.id);

      if (updateEventReservationError && !isTableMissing(updateEventReservationError, 'stripe_webhook_events')) {
        console.error('stripe_webhook_events update reservation_id failed', updateEventReservationError);
      }
    }

    if (insertEventError && isTableMissing(insertEventError, 'stripe_webhook_events')) {
      console.warn('stripe_webhook_events table missing, webhook idempotency persistence disabled for this event.');
    }

    return withJson({
      received: true,
      eventId: event.id,
      type: event.type,
      pendingCheckoutId,
      checkoutSessionId,
      paymentIntentId,
      result: processingResult,
    }, 200);
  } catch (error) {
    console.error('stripe-webhook unexpected error', error);
    return withJson({ error: error instanceof Error ? error.message : 'Unknown error.' }, 500);
  }
});
