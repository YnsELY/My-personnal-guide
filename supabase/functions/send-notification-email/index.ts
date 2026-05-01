// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Templates ────────────────────────────────────────────────────────────────

type SupportedLanguage = 'fr' | 'en' | 'ar';

type SignupTemplateInput = {
  language?: string | null;
  pilgrimName?: string | null;
};

type ReservationTemplateInput = {
  language?: string | null;
  reservationId: string;
  serviceName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  visitTime?: string | null;
  location?: string | null;
  totalPrice?: number | null;
  guideName?: string | null;
  guideEmail?: string | null;
  pilgrimName?: string | null;
  pilgrimEmail?: string | null;
  pilgrimsNames?: string[] | null;
  transportPickupType?: string | null;
  hotelAddress?: string | null;
  hotelDistanceKm?: number | null;
  transportExtraFeeAmount?: number | null;
};

type EmailTemplateResult = { subject: string; html: string; text: string };

type CopySet = {
  locale: string;
  dir: 'ltr' | 'rtl';
  greeting: (name: string) => string;
  teamSignature: string;
  signupSubject: string;
  signupEyebrow: string;
  signupTitle: string;
  signupIntro: string;
  signupOutro: string;
  pilgrimOrderSubject: string;
  pilgrimOrderEyebrow: string;
  pilgrimOrderTitle: string;
  pilgrimOrderIntro: (guideName: string) => string;
  guideBookingSubject: string;
  guideBookingEyebrow: string;
  guideBookingTitle: string;
  guideBookingIntro: (pilgrimName: string) => string;
  reservationBlockTitle: string;
  serviceAndContactTitle: string;
  reservationIdLabel: string;
  serviceLabel: string;
  guideLabel: string;
  guideEmailLabel: string;
  pilgrimLabel: string;
  pilgrimEmailLabel: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  totalLabel: string;
  pilgrimsLabel: string;
  transportLabel: string;
  hotelAddressLabel: string;
  hotelDistanceLabel: string;
  transportExtraLabel: string;
  fallbackDate: string;
  fallbackTime: string;
  fallbackLocation: string;
  fallbackList: string;
  fallbackTransport: string;
  haramPickup: string;
  hotelPickup: string;
};

const BRAND_NAME = 'Guide Omra';
const BRAND_COLOR = '#b39164';

const COPY: Record<SupportedLanguage, CopySet> = {
  fr: {
    locale: 'fr-FR',
    dir: 'ltr',
    greeting: (name) => `Bonjour ${name},`,
    teamSignature: `L'equipe ${BRAND_NAME}`,
    signupSubject: `Confirmation d'inscription - ${BRAND_NAME}`,
    signupEyebrow: 'Inscription',
    signupTitle: 'Votre compte pelerin est bien cree',
    signupIntro: "Votre inscription a bien ete prise en compte. Vous pouvez des maintenant consulter les guides, reserver un service et suivre vos commandes depuis l'application.",
    signupOutro: 'Merci pour votre confiance.',
    pilgrimOrderSubject: `Confirmation de commande - ${BRAND_NAME}`,
    pilgrimOrderEyebrow: 'Commande',
    pilgrimOrderTitle: 'Votre reservation a bien ete enregistree',
    pilgrimOrderIntro: (guideName) => `Votre commande a ete creee avec succes${guideName ? ` avec ${guideName}` : ''}. Retrouvez ci-dessous le recapitulatif de votre reservation.`,
    guideBookingSubject: `Nouvelle reservation recue - ${BRAND_NAME}`,
    guideBookingEyebrow: 'Reservation guide',
    guideBookingTitle: 'Un pelerin a commande l un de vos services',
    guideBookingIntro: (pilgrimName) => `${pilgrimName || 'Un pelerin'} a commande l un de vos services. Voici les informations utiles pour preparer la reservation.`,
    reservationBlockTitle: 'Details de la reservation',
    serviceAndContactTitle: 'Service et contacts',
    reservationIdLabel: 'Reference',
    serviceLabel: 'Service',
    guideLabel: 'Guide',
    guideEmailLabel: 'Email du guide',
    pilgrimLabel: 'Pelerin',
    pilgrimEmailLabel: 'Email du pelerin',
    dateLabel: 'Date',
    timeLabel: 'Heure',
    locationLabel: 'Lieu',
    totalLabel: 'Montant total',
    pilgrimsLabel: 'Pelerins',
    transportLabel: 'Transport',
    hotelAddressLabel: 'Adresse hotel',
    hotelDistanceLabel: 'Distance hotel',
    transportExtraLabel: 'Supplement transport',
    fallbackDate: 'Date non precisee',
    fallbackTime: 'Heure non precisee',
    fallbackLocation: 'Lieu non precise',
    fallbackList: 'Non precise',
    fallbackTransport: 'Non precise',
    haramPickup: 'Depart depuis le Haram',
    hotelPickup: "Prise en charge a l'hotel",
  },
  en: {
    locale: 'en-US',
    dir: 'ltr',
    greeting: (name) => `Hello ${name},`,
    teamSignature: `${BRAND_NAME} team`,
    signupSubject: `Registration confirmation - ${BRAND_NAME}`,
    signupEyebrow: 'Registration',
    signupTitle: 'Your pilgrim account is ready',
    signupIntro: 'Your registration has been confirmed. You can now browse guides, book a service, and track your orders in the app.',
    signupOutro: 'Thank you for your trust.',
    pilgrimOrderSubject: `Order confirmation - ${BRAND_NAME}`,
    pilgrimOrderEyebrow: 'Order',
    pilgrimOrderTitle: 'Your reservation has been recorded',
    pilgrimOrderIntro: (guideName) => `Your order was created successfully${guideName ? ` with ${guideName}` : ''}. You can find your reservation summary below.`,
    guideBookingSubject: `New booking received - ${BRAND_NAME}`,
    guideBookingEyebrow: 'Guide booking',
    guideBookingTitle: 'A pilgrim booked one of your services',
    guideBookingIntro: (pilgrimName) => `${pilgrimName || 'A pilgrim'} booked one of your services. Here is the booking summary.`,
    reservationBlockTitle: 'Reservation details',
    serviceAndContactTitle: 'Service and contacts',
    reservationIdLabel: 'Reference',
    serviceLabel: 'Service',
    guideLabel: 'Guide',
    guideEmailLabel: 'Guide email',
    pilgrimLabel: 'Pilgrim',
    pilgrimEmailLabel: 'Pilgrim email',
    dateLabel: 'Date',
    timeLabel: 'Time',
    locationLabel: 'Location',
    totalLabel: 'Total amount',
    pilgrimsLabel: 'Pilgrims',
    transportLabel: 'Transport',
    hotelAddressLabel: 'Hotel address',
    hotelDistanceLabel: 'Hotel distance',
    transportExtraLabel: 'Transport extra',
    fallbackDate: 'Date not specified',
    fallbackTime: 'Time not specified',
    fallbackLocation: 'Location not specified',
    fallbackList: 'Not specified',
    fallbackTransport: 'Not specified',
    haramPickup: 'Pickup from Haram',
    hotelPickup: 'Hotel pickup',
  },
  ar: {
    locale: 'ar-SA',
    dir: 'rtl',
    greeting: (name) => `\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645 ${name}\u060c`,
    teamSignature: `\u0641\u0631\u064a\u0642 ${BRAND_NAME}`,
    signupSubject: `\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0633\u062c\u064a\u0644 - ${BRAND_NAME}`,
    signupEyebrow: '\u0627\u0644\u062a\u0633\u062c\u064a\u0644',
    signupTitle: '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u0627\u0644\u062d\u0627\u062c \u0628\u0646\u062c\u0627\u062d',
    signupIntro: '\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u062a\u0633\u062c\u064a\u0644\u0643. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062a\u0635\u0641\u062d \u0627\u0644\u0645\u0631\u0634\u062f\u064a\u0646\u060c \u062d\u062c\u0632 \u062e\u062f\u0645\u0629\u060c \u0648\u0645\u062a\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u0627\u062a\u0643 \u062f\u0627\u062e\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642.',
    signupOutro: '\u0634\u0643\u0631\u0627 \u0644\u062b\u0642\u062a\u0643.',
    pilgrimOrderSubject: `\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628 - ${BRAND_NAME}`,
    pilgrimOrderEyebrow: '\u0627\u0644\u0637\u0644\u0628',
    pilgrimOrderTitle: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u062d\u062c\u0632\u0643 \u0628\u0646\u062c\u0627\u062d',
    pilgrimOrderIntro: (guideName) => `\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628\u0643 \u0628\u0646\u062c\u0627\u062d${guideName ? ` \u0645\u0639 ${guideName}` : ''}. \u062a\u062c\u062f \u0623\u062f\u0646\u0627\u0647 \u0645\u0644\u062e\u0635 \u0627\u0644\u062d\u062c\u0632.`,
    guideBookingSubject: `\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u062d\u062c\u0632 \u062c\u062f\u064a\u062f - ${BRAND_NAME}`,
    guideBookingEyebrow: '\u062d\u062c\u0632 \u0627\u0644\u0645\u0631\u0634\u062f',
    guideBookingTitle: '\u0642\u0627\u0645 \u062d\u0627\u062c \u0628\u062d\u062c\u0632 \u0625\u062d\u062f\u0649 \u062e\u062f\u0645\u0627\u062a\u0643',
    guideBookingIntro: (pilgrimName) => `${pilgrimName || '\u0623\u062d\u062f \u0627\u0644\u062d\u062c\u0627\u062c'} \u0642\u0627\u0645 \u0628\u062d\u062c\u0632 \u0625\u062d\u062f\u0649 \u062e\u062f\u0645\u0627\u062a\u0643. \u0641\u064a\u0645\u0627 \u064a\u0644\u064a \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062d\u062c\u0632.`,
    reservationBlockTitle: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062d\u062c\u0632',
    serviceAndContactTitle: '\u0627\u0644\u062e\u062f\u0645\u0629 \u0648\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644',
    reservationIdLabel: '\u0627\u0644\u0645\u0631\u062c\u0639',
    serviceLabel: '\u0627\u0644\u062e\u062f\u0645\u0629',
    guideLabel: '\u0627\u0644\u0645\u0631\u0634\u062f',
    guideEmailLabel: '\u0628\u0631\u064a\u062f \u0627\u0644\u0645\u0631\u0634\u062f',
    pilgrimLabel: '\u0627\u0644\u062d\u0627\u062c',
    pilgrimEmailLabel: '\u0628\u0631\u064a\u062f \u0627\u0644\u062d\u0627\u062c',
    dateLabel: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e',
    timeLabel: '\u0627\u0644\u0648\u0642\u062a',
    locationLabel: '\u0627\u0644\u0645\u0643\u0627\u0646',
    totalLabel: '\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a',
    pilgrimsLabel: '\u0627\u0644\u062d\u062c\u0627\u062c',
    transportLabel: '\u0627\u0644\u0646\u0642\u0644',
    hotelAddressLabel: '\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0641\u0646\u062f\u0642',
    hotelDistanceLabel: '\u0645\u0633\u0627\u0641\u0629 \u0627\u0644\u0641\u0646\u062f\u0642',
    transportExtraLabel: '\u0631\u0633\u0648\u0645 \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629',
    fallbackDate: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    fallbackTime: '\u0627\u0644\u0648\u0642\u062a \u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    fallbackLocation: '\u0627\u0644\u0645\u0643\u0627\u0646 \u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    fallbackList: '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    fallbackTransport: '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
    haramPickup: '\u0627\u0644\u0627\u0646\u0637\u0644\u0627\u0642 \u0645\u0646 \u0627\u0644\u062d\u0631\u0645',
    hotelPickup: '\u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0645\u0646 \u0627\u0644\u0641\u0646\u062f\u0642',
  },
};

const normalizeLanguage = (value?: string | null): SupportedLanguage => {
  if (value === 'ar') return 'ar';
  if (value === 'en') return 'en';
  return 'fr';
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatDateValue = (value?: string | null, locale = 'fr-FR') => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

const formatDateRange = (copy: CopySet, startDate?: string | null, endDate?: string | null) => {
  const start = formatDateValue(startDate, copy.locale);
  const end = formatDateValue(endDate, copy.locale);
  if (!start && !end) return copy.fallbackDate;
  if (start && end && start !== end) return `${start} - ${end}`;
  return start || end || copy.fallbackDate;
};

const formatCurrency = (value?: number | null, locale = 'fr-FR') => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const renderRows = (rows: Array<{ label: string; value: string }>) => {
  const html = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;width:38%;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(row.value)}</td>
        </tr>
      `
    )
    .join('');
  const text = rows.map((row) => `${row.label}: ${row.value}`).join('\n');
  return {
    html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${html}</table>`,
    text,
  };
};

const renderLayout = (params: {
  copy: CopySet;
  eyebrow: string;
  title: string;
  greeting: string;
  intro: string;
  sections: Array<{ title: string; rows: Array<{ label: string; value: string }> }>;
  outro: string;
}) => {
  const sectionsHtml = params.sections
    .map((section) => {
      const rendered = renderRows(section.rows);
      return `<div style="margin-top:24px;padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;"><div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:14px;">${escapeHtml(section.title)}</div>${rendered.html}</div>`;
    })
    .join('');

  const sectionsText = params.sections
    .map((section) => {
      const rendered = renderRows(section.rows);
      return `${section.title}\n${rendered.text}`;
    })
    .join('\n\n');

  const html = `<!doctype html><html lang="${params.copy.locale}" dir="${params.copy.dir}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(params.title)}</title></head><body style="margin:0;padding:0;background:#f6f1ea;font-family:Arial, Helvetica, sans-serif;color:#111827;"><div style="padding:32px 16px;"><div style="max-width:640px;margin:0 auto;background:#fffaf5;border-radius:24px;overflow:hidden;border:1px solid #eadfce;"><div style="padding:28px 32px;background:${BRAND_COLOR};color:#ffffff;"><div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">${escapeHtml(params.eyebrow)}</div><div style="font-size:28px;font-weight:700;line-height:1.2;margin-top:10px;">${escapeHtml(params.title)}</div></div><div style="padding:28px 32px;"><div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:10px;">${escapeHtml(params.greeting)}</div><div style="font-size:15px;line-height:1.7;color:#374151;">${escapeHtml(params.intro)}</div>${sectionsHtml}<div style="font-size:15px;line-height:1.7;color:#374151;margin-top:24px;">${escapeHtml(params.outro)}</div><div style="font-size:15px;line-height:1.7;color:#111827;font-weight:700;margin-top:12px;">${escapeHtml(params.copy.teamSignature)}</div></div></div></div></body></html>`;
  const text = `${params.title}\n\n${params.greeting}\n\n${params.intro}\n\n${sectionsText}\n\n${params.outro}\n${params.copy.teamSignature}`;
  return { html, text };
};

const buildReservationDetailsRows = (copy: CopySet, input: ReservationTemplateInput) => {
  const pilgrims = (input.pilgrimsNames || [])
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .join(', ');

  const transportLabel = input.transportPickupType === 'haram'
    ? copy.haramPickup
    : input.transportPickupType === 'hotel'
      ? copy.hotelPickup
      : copy.fallbackTransport;

  return [
    { label: copy.reservationIdLabel, value: input.reservationId },
    { label: copy.dateLabel, value: formatDateRange(copy, input.startDate, input.endDate) },
    { label: copy.timeLabel, value: input.visitTime || copy.fallbackTime },
    { label: copy.locationLabel, value: input.location || copy.fallbackLocation },
    { label: copy.totalLabel, value: formatCurrency(input.totalPrice, copy.locale) },
    { label: copy.pilgrimsLabel, value: pilgrims || copy.fallbackList },
    { label: copy.transportLabel, value: transportLabel },
    ...(input.hotelAddress ? [{ label: copy.hotelAddressLabel, value: input.hotelAddress }] : []),
    ...(Number.isFinite(Number(input.hotelDistanceKm)) ? [{ label: copy.hotelDistanceLabel, value: `${input.hotelDistanceKm} km` }] : []),
    ...(Number(input.transportExtraFeeAmount || 0) > 0 ? [{ label: copy.transportExtraLabel, value: formatCurrency(input.transportExtraFeeAmount, copy.locale) }] : []),
  ];
};

const buildPilgrimSignupTemplate = (input: SignupTemplateInput): EmailTemplateResult => {
  const language = normalizeLanguage(input.language);
  const copy = COPY[language];
  const pilgrimName = (input.pilgrimName || 'Pelerin').trim() || 'Pelerin';
  const rendered = renderLayout({
    copy,
    eyebrow: copy.signupEyebrow,
    title: copy.signupTitle,
    greeting: copy.greeting(pilgrimName),
    intro: copy.signupIntro,
    sections: [],
    outro: copy.signupOutro,
  });
  return { subject: copy.signupSubject, html: rendered.html, text: rendered.text };
};

const buildPilgrimOrderTemplate = (input: ReservationTemplateInput): EmailTemplateResult => {
  const language = normalizeLanguage(input.language);
  const copy = COPY[language];
  const pilgrimName = (input.pilgrimName || 'Pelerin').trim() || 'Pelerin';
  const guideName = (input.guideName || 'Guide').trim() || 'Guide';
  const rendered = renderLayout({
    copy,
    eyebrow: copy.pilgrimOrderEyebrow,
    title: copy.pilgrimOrderTitle,
    greeting: copy.greeting(pilgrimName),
    intro: copy.pilgrimOrderIntro(guideName),
    sections: [
      { title: copy.reservationBlockTitle, rows: buildReservationDetailsRows(copy, input) },
      {
        title: copy.serviceAndContactTitle,
        rows: [
          { label: copy.serviceLabel, value: input.serviceName || copy.fallbackList },
          { label: copy.guideLabel, value: guideName },
          ...(input.guideEmail ? [{ label: copy.guideEmailLabel, value: input.guideEmail }] : []),
        ],
      },
    ],
    outro: copy.signupOutro,
  });
  return { subject: copy.pilgrimOrderSubject, html: rendered.html, text: rendered.text };
};

const buildGuideBookingTemplate = (input: ReservationTemplateInput): EmailTemplateResult => {
  const language = normalizeLanguage(input.language);
  const copy = COPY[language];
  const guideName = (input.guideName || 'Guide').trim() || 'Guide';
  const pilgrimName = (input.pilgrimName || 'Pelerin').trim() || 'Pelerin';
  const rendered = renderLayout({
    copy,
    eyebrow: copy.guideBookingEyebrow,
    title: copy.guideBookingTitle,
    greeting: copy.greeting(guideName),
    intro: copy.guideBookingIntro(pilgrimName),
    sections: [
      { title: copy.reservationBlockTitle, rows: buildReservationDetailsRows(copy, input) },
      {
        title: copy.serviceAndContactTitle,
        rows: [
          { label: copy.serviceLabel, value: input.serviceName || copy.fallbackList },
          { label: copy.pilgrimLabel, value: pilgrimName },
          ...(input.pilgrimEmail ? [{ label: copy.pilgrimEmailLabel, value: input.pilgrimEmail }] : []),
        ],
      },
    ],
    outro: copy.signupOutro,
  });
  return { subject: copy.guideBookingSubject, html: rendered.html, text: rendered.text };
};

// ── Email sending ─────────────────────────────────────────────────────────────

type EmailNotificationType =
  | 'pilgrim_signup_confirmation'
  | 'pilgrim_order_confirmation'
  | 'guide_booking_confirmation';

type ReservationNotificationType =
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

  if (!error && data?.id) return { status: 'claimed', id: String(data.id) };
  if (!isUniqueViolation(error)) throw error;

  const { data: existing, error: existingError } = await admin
    .from('email_notification_logs')
    .select('id,status')
    .eq('notification_key', params.notificationKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing?.id) return { status: 'busy' };
  if (existing.status === 'sent') return { status: 'already_sent', id: String(existing.id) };
  if (existing.status === 'processing') return { status: 'busy', id: String(existing.id) };

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
    .update({ status: 'sent', sent_at: now, last_error: null, updated_at: now })
    .eq('id', notificationId);
  if (error) throw error;
};

const markNotificationFailed = async (admin: SupabaseAdminClient, notificationId: string, message: string) => {
  const { error } = await admin
    .from('email_notification_logs')
    .update({ status: 'failed', last_error: truncate(message), updated_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) console.error('email_notification_logs update failed', error);
};

const sendEmail = async (params: { to: string; subject: string; html: string; text: string }) => {
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
    .select('id,user_id,guide_id,service_name,start_date,end_date,visit_time,location,total_price,pilgrims_names,transport_pickup_type,hotel_address,hotel_distance_km,transport_extra_fee_amount')
    .eq('id', reservationId)
    .maybeSingle();

  if (reservationError) throw reservationError;
  if (!reservation) throw new Error('Reservation not found.');

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

const sendPilgrimSignupConfirmationIfNeeded = async (admin: SupabaseAdminClient, profileId: string) => {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id,email,full_name,role,language')
    .eq('id', profileId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error('Profile not found.');
  if (profile.role !== 'pilgrim') return { status: 'skipped', reason: 'profile_is_not_pilgrim' };

  const recipientEmail = String(profile.email || '').trim();
  if (!recipientEmail) return { status: 'skipped', reason: 'missing_recipient_email' };

  const notificationKey = `pilgrim_signup_confirmation:${profileId}`;
  const claim = await claimNotification(admin, {
    notificationKey,
    notificationType: 'pilgrim_signup_confirmation',
    recipientEmail,
    profileId,
  });

  if (claim.status !== 'claimed') return { status: claim.status, notificationKey };

  const template = buildPilgrimSignupTemplate({ language: profile.language, pilgrimName: profile.full_name });
  try {
    await sendEmail({ to: recipientEmail, subject: template.subject, html: template.html, text: template.text });
    await markNotificationSent(admin, claim.id);
    return { status: 'sent', notificationKey };
  } catch (err: any) {
    await markNotificationFailed(admin, claim.id, String(err?.message || err));
    throw err;
  }
};

const sendReservationNotificationIfNeeded = async (admin: SupabaseAdminClient, type: ReservationNotificationType, reservationId: string) => {
  const { reservation, pilgrimProfile, guideProfile } = await loadReservationContext(admin, reservationId);
  const isGuideNotification = type === 'guide_booking_confirmation';
  const recipient = isGuideNotification ? guideProfile : pilgrimProfile;
  const recipientEmail = String(recipient?.email || '').trim();

  if (!recipientEmail) return { status: 'skipped', reason: 'missing_recipient_email' };

  const notificationKey = `${type}:${reservationId}`;
  const claim = await claimNotification(admin, {
    notificationKey,
    notificationType: type,
    recipientEmail,
    profileId: recipient?.id || null,
    reservationId,
  });

  if (claim.status !== 'claimed') return { status: claim.status, notificationKey };

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

  const template = isGuideNotification ? buildGuideBookingTemplate(templateInput) : buildPilgrimOrderTemplate(templateInput);
  try {
    await sendEmail({ to: recipientEmail, subject: template.subject, html: template.html, text: template.text });
    await markNotificationSent(admin, claim.id);
    return { status: 'sent', notificationKey };
  } catch (err: any) {
    await markNotificationFailed(admin, claim.id, String(err?.message || err));
    throw err;
  }
};

// ── HTTP handler ──────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const withJson = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return withJson({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization') || '';

    if (!supabaseUrl || !supabaseAnonKey) return withJson({ error: 'Missing Supabase environment variables.' }, 500);
    if (!authHeader) return withJson({ error: 'Missing authorization header.' }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const admin = createAdminClientFromEnv();

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData?.user) return withJson({ error: 'Unauthorized.' }, 401);

    const body = await req.json();
    const type = String(body?.type || '').trim();

    if (type === 'pilgrim_signup_confirmation') {
      const profileId = String(body?.profileId || '').trim();
      if (!profileId) return withJson({ error: 'profileId is required.' }, 400);
      if (authData.user.id !== profileId) return withJson({ error: 'Forbidden.' }, 403);
      const result = await sendPilgrimSignupConfirmationIfNeeded(admin, profileId);
      return withJson({ ok: true, result });
    }

    if (type === 'pilgrim_order_confirmation' || type === 'guide_booking_confirmation') {
      const reservationId = String(body?.reservationId || '').trim();
      if (!reservationId) return withJson({ error: 'reservationId is required.' }, 400);

      const { data: reservation, error: reservationError } = await admin
        .from('reservations')
        .select('id,user_id,guide_id')
        .eq('id', reservationId)
        .maybeSingle();

      if (reservationError) throw reservationError;
      if (!reservation) return withJson({ error: 'Reservation not found.' }, 404);

      const isRelatedUser = authData.user.id === reservation.user_id || authData.user.id === reservation.guide_id;
      if (!isRelatedUser) return withJson({ error: 'Forbidden.' }, 403);

      const result = await sendReservationNotificationIfNeeded(admin, type, reservationId);
      return withJson({ ok: true, result });
    }

    return withJson({ error: 'Unsupported notification type.' }, 400);
  } catch (error) {
    console.error('send-notification-email error', error);
    return withJson({ error: error instanceof Error ? error.message : 'Unknown error.' }, 500);
  }
});
