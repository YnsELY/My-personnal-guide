import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  buildGuideBookingTemplate,
  buildPilgrimOrderTemplate,
  buildPilgrimSignupTemplate,
} from './notification-email-templates.ts';

export type EmailNotificationType =
  | 'pilgrim_signup_confirmation'
  | 'pilgrim_order_confirmation'
  | 'guide_booking_confirmation';

export type ReservationNotificationType =
  | 'pilgrim_order_confirmation'
  | 'guide_booking_confirmation';

type SupabaseAdminClient = ReturnType<typeof createClient>;

type NotificationClaim =
  | { status: 'claimed'; id: string }
  | { status: 'already_sent'; id?: string | null }
  | { status: 'busy'; id?: string | null };

const RESEND_API_URL = 'https://api.resend.com/emails';

const getEnv = (key: string) => String(Deno.env.get(key) || '').trim();

const createAdminClientFromEnv = () => {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const truncate = (value: string, max = 500) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const isUniqueViolation = (error: any) =>
  error?.code === '23505' || String(error?.message || '').toLowerCase().includes('duplicate key');

const claimNotification = async (admin: SupabaseAdminClient, params: {
  notificationKey: string;
  notificationType: EmailNotificationType;
  recipientEmail: string;
  profileId?: string | null;
  reservationId?: string | null;
}): Promise<NotificationClaim> => {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('email_notification_logs')
    .insert({
      notification_key: params.notificationKey,
      notification_type: params.notificationType,
      status: 'processing',
      recipient_email: params.recipientEmail,
      profile_id: params.profileId || null,
      reservation_id: params.reservationId || null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (!error && data?.id) {
    return { status: 'claimed', id: String(data.id) };
  }

  if (!isUniqueViolation(error)) {
    throw error;
  }

  const { data: existing, error: existingError } = await admin
    .from('email_notification_logs')
    .select('id,status')
    .eq('notification_key', params.notificationKey)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing?.id) {
    return { status: 'busy' };
  }

  if (existing.status === 'sent') {
    return { status: 'already_sent', id: String(existing.id) };
  }

  if (existing.status === 'processing') {
    return { status: 'busy', id: String(existing.id) };
  }

  const { data: retryRow, error: retryError } = await admin
    .from('email_notification_logs')
    .update({
      status: 'processing',
      recipient_email: params.recipientEmail,
      profile_id: params.profileId || null,
      reservation_id: params.reservationId || null,
      last_error: null,
      updated_at: now,
    })
    .eq('id', existing.id)
    .eq('status', 'failed')
    .select('id')
    .maybeSingle();

  if (retryError) throw retryError;
  if (!retryRow?.id) return { status: 'busy', id: String(existing.id) };

  return { status: 'claimed', id: String(retryRow.id) };
};

const markNotificationSent = async (admin: SupabaseAdminClient, notificationId: string) => {
  const now = new Date().toISOString();
  const { error } = await admin
    .from('email_notification_logs')
    .update({
      status: 'sent',
      sent_at: now,
      last_error: null,
      updated_at: now,
    })
    .eq('id', notificationId);

  if (error) throw error;
};

const markNotificationFailed = async (
  admin: SupabaseAdminClient,
  notificationId: string,
  message: string,
) => {
  const { error } = await admin
    .from('email_notification_logs')
    .update({
      status: 'failed',
      last_error: truncate(message),
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('email_notification_logs update failed', error);
  }
};

const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const resendApiKey = getEnv('RESEND_API_KEY');
  const fromEmail = getEnv('RESEND_FROM_EMAIL') || getEnv('RESEND_FROM');
  const replyTo = getEnv('RESEND_REPLY_TO');

  if (!resendApiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL.');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      reply_to: replyTo || undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Resend error ${response.status}: ${raw}`);
  }

  return response.json();
};

const loadReservationContext = async (admin: SupabaseAdminClient, reservationId: string) => {
  const { data: reservation, error: reservationError } = await admin
    .from('reservations')
    .select(`
      id,
      user_id,
      guide_id,
      service_name,
      start_date,
      end_date,
      visit_time,
      location,
      total_price,
      pilgrims_names,
      transport_pickup_type,
      hotel_address,
      hotel_distance_km,
      transport_extra_fee_amount
    `)
    .eq('id', reservationId)
    .maybeSingle();

  if (reservationError) throw reservationError;
  if (!reservation) {
    throw new Error('Reservation not found.');
  }

  const profileIds = [reservation.user_id, reservation.guide_id].filter(Boolean);
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id,email,full_name,language')
    .in('id', profileIds);

  if (profilesError) throw profilesError;

  const byId = new Map((profiles || []).map((row: any) => [String(row.id), row]));

  return {
    reservation,
    pilgrimProfile: byId.get(String(reservation.user_id)),
    guideProfile: byId.get(String(reservation.guide_id)),
  };
};

export const sendPilgrimSignupConfirmationIfNeeded = async (
  admin: SupabaseAdminClient,
  profileId: string,
) => {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id,email,full_name,role,language')
    .eq('id', profileId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error('Profile not found.');

  if (profile.role !== 'pilgrim') {
    return { status: 'skipped', reason: 'profile_is_not_pilgrim' };
  }

  const recipientEmail = String(profile.email || '').trim();
  if (!recipientEmail) {
    return { status: 'skipped', reason: 'missing_recipient_email' };
  }

  const notificationKey = `pilgrim_signup_confirmation:${profileId}`;
  const claim = await claimNotification(admin, {
    notificationKey,
    notificationType: 'pilgrim_signup_confirmation',
    recipientEmail,
    profileId,
  });

  if (claim.status !== 'claimed') {
    return { status: claim.status, notificationKey };
  }

  const template = buildPilgrimSignupTemplate({
    language: profile.language,
    pilgrimName: profile.full_name,
  });

  try {
    await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    await markNotificationSent(admin, claim.id);
    return { status: 'sent', notificationKey };
  } catch (error: any) {
    await markNotificationFailed(admin, claim.id, String(error?.message || error));
    throw error;
  }
};

export const sendReservationNotificationIfNeeded = async (
  admin: SupabaseAdminClient,
  type: ReservationNotificationType,
  reservationId: string,
) => {
  const { reservation, pilgrimProfile, guideProfile } = await loadReservationContext(admin, reservationId);

  const isGuideNotification = type === 'guide_booking_confirmation';
  const recipient = isGuideNotification ? guideProfile : pilgrimProfile;
  const recipientEmail = String(recipient?.email || '').trim();

  if (!recipientEmail) {
    return { status: 'skipped', reason: 'missing_recipient_email' };
  }

  const notificationKey = `${type}:${reservationId}`;
  const claim = await claimNotification(admin, {
    notificationKey,
    notificationType: type,
    recipientEmail,
    profileId: recipient?.id || null,
    reservationId,
  });

  if (claim.status !== 'claimed') {
    return { status: claim.status, notificationKey };
  }

  const templateInput = {
    language: recipient?.language,
    reservationId: String(reservation.id),
    serviceName: reservation.service_name,
    startDate: reservation.start_date,
    endDate: reservation.end_date,
    visitTime: reservation.visit_time,
    location: reservation.location,
    totalPrice: Number(reservation.total_price || 0),
    guideName: guideProfile?.full_name,
    guideEmail: guideProfile?.email,
    pilgrimName: pilgrimProfile?.full_name,
    pilgrimEmail: pilgrimProfile?.email,
    pilgrimsNames: Array.isArray(reservation.pilgrims_names) ? reservation.pilgrims_names : [],
    transportPickupType: reservation.transport_pickup_type,
    hotelAddress: reservation.hotel_address,
    hotelDistanceKm: reservation.hotel_distance_km,
    transportExtraFeeAmount: reservation.transport_extra_fee_amount,
  };

  const template = isGuideNotification
    ? buildGuideBookingTemplate(templateInput)
    : buildPilgrimOrderTemplate(templateInput);

  try {
    await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    await markNotificationSent(admin, claim.id);
    return { status: 'sent', notificationKey };
  } catch (error: any) {
    await markNotificationFailed(admin, claim.id, String(error?.message || error));
    throw error;
  }
};

export const createEmailAdminClient = () => createAdminClientFromEnv();
