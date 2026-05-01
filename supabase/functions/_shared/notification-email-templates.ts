export type SupportedLanguage = 'fr' | 'en' | 'ar';

export type SignupTemplateInput = {
  language?: string | null;
  pilgrimName?: string | null;
};

export type ReservationTemplateInput = {
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

type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

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
    greeting: (name) => `السلام عليكم ${name}،`,
    teamSignature: `فريق ${BRAND_NAME}`,
    signupSubject: `تأكيد التسجيل - ${BRAND_NAME}`,
    signupEyebrow: 'التسجيل',
    signupTitle: 'تم إنشاء حساب الحاج بنجاح',
    signupIntro: 'تم تأكيد تسجيلك. يمكنك الآن تصفح المرشدين، حجز خدمة، ومتابعة طلباتك داخل التطبيق.',
    signupOutro: 'شكرا لثقتك.',
    pilgrimOrderSubject: `تأكيد الطلب - ${BRAND_NAME}`,
    pilgrimOrderEyebrow: 'الطلب',
    pilgrimOrderTitle: 'تم تسجيل حجزك بنجاح',
    pilgrimOrderIntro: (guideName) => `تم إنشاء طلبك بنجاح${guideName ? ` مع ${guideName}` : ''}. تجد أدناه ملخص الحجز.`,
    guideBookingSubject: `تم استلام حجز جديد - ${BRAND_NAME}`,
    guideBookingEyebrow: 'حجز المرشد',
    guideBookingTitle: 'قام حاج بحجز إحدى خدماتك',
    guideBookingIntro: (pilgrimName) => `${pilgrimName || 'أحد الحجاج'} قام بحجز إحدى خدماتك. فيما يلي تفاصيل الحجز.`,
    reservationBlockTitle: 'تفاصيل الحجز',
    serviceAndContactTitle: 'الخدمة وبيانات التواصل',
    reservationIdLabel: 'المرجع',
    serviceLabel: 'الخدمة',
    guideLabel: 'المرشد',
    guideEmailLabel: 'بريد المرشد',
    pilgrimLabel: 'الحاج',
    pilgrimEmailLabel: 'بريد الحاج',
    dateLabel: 'التاريخ',
    timeLabel: 'الوقت',
    locationLabel: 'المكان',
    totalLabel: 'المبلغ الإجمالي',
    pilgrimsLabel: 'الحجاج',
    transportLabel: 'النقل',
    hotelAddressLabel: 'عنوان الفندق',
    hotelDistanceLabel: 'مسافة الفندق',
    transportExtraLabel: 'رسوم النقل الإضافية',
    fallbackDate: 'التاريخ غير محدد',
    fallbackTime: 'الوقت غير محدد',
    fallbackLocation: 'المكان غير محدد',
    fallbackList: 'غير محدد',
    fallbackTransport: 'غير محدد',
    haramPickup: 'الانطلاق من الحرم',
    hotelPickup: 'الاستلام من الفندق',
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
    html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${html}
      </table>
    `,
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
      return `
        <div style="margin-top:24px;padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;">
          <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:14px;">${escapeHtml(section.title)}</div>
          ${rendered.html}
        </div>
      `;
    })
    .join('');

  const sectionsText = params.sections
    .map((section) => {
      const rendered = renderRows(section.rows);
      return `${section.title}\n${rendered.text}`;
    })
    .join('\n\n');

  const html = `
    <!doctype html>
    <html lang="${params.copy.locale}" dir="${params.copy.dir}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(params.title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f1ea;font-family:Arial, Helvetica, sans-serif;color:#111827;">
        <div style="padding:32px 16px;">
          <div style="max-width:640px;margin:0 auto;background:#fffaf5;border-radius:24px;overflow:hidden;border:1px solid #eadfce;">
            <div style="padding:28px 32px;background:${BRAND_COLOR};color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">${escapeHtml(params.eyebrow)}</div>
              <div style="font-size:28px;font-weight:700;line-height:1.2;margin-top:10px;">${escapeHtml(params.title)}</div>
            </div>
            <div style="padding:28px 32px;">
              <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:10px;">${escapeHtml(params.greeting)}</div>
              <div style="font-size:15px;line-height:1.7;color:#374151;">${escapeHtml(params.intro)}</div>
              ${sectionsHtml}
              <div style="font-size:15px;line-height:1.7;color:#374151;margin-top:24px;">${escapeHtml(params.outro)}</div>
              <div style="font-size:15px;line-height:1.7;color:#111827;font-weight:700;margin-top:12px;">${escapeHtml(params.copy.teamSignature)}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `${params.title}\n\n${params.greeting}\n\n${params.intro}\n\n${sectionsText}\n\n${params.outro}\n${params.copy.teamSignature}`;

  return { html, text };
};

const buildReservationDetailsRows = (copy: CopySet, input: ReservationTemplateInput) => {
  const pilgrims = (input.pilgrimsNames || [])
    .map((name) => String(name || '').trim())
    .filter(Boolean)
    .join(', ');

  const transportLabel = (() => {
    if (input.transportPickupType === 'haram') return copy.haramPickup;
    if (input.transportPickupType === 'hotel') return copy.hotelPickup;
    return copy.fallbackTransport;
  })();

  return [
    { label: copy.reservationIdLabel, value: input.reservationId },
    { label: copy.dateLabel, value: formatDateRange(copy, input.startDate, input.endDate) },
    { label: copy.timeLabel, value: input.visitTime || copy.fallbackTime },
    { label: copy.locationLabel, value: input.location || copy.fallbackLocation },
    { label: copy.totalLabel, value: formatCurrency(input.totalPrice, copy.locale) },
    { label: copy.pilgrimsLabel, value: pilgrims || copy.fallbackList },
    { label: copy.transportLabel, value: transportLabel },
    ...(input.hotelAddress ? [{ label: copy.hotelAddressLabel, value: input.hotelAddress }] : []),
    ...(Number.isFinite(Number(input.hotelDistanceKm))
      ? [{ label: copy.hotelDistanceLabel, value: `${input.hotelDistanceKm} km` }]
      : []),
    ...(Number(input.transportExtraFeeAmount || 0) > 0
      ? [{ label: copy.transportExtraLabel, value: formatCurrency(input.transportExtraFeeAmount, copy.locale) }]
      : []),
  ];
};

export const buildPilgrimSignupTemplate = (input: SignupTemplateInput): EmailTemplateResult => {
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

  return {
    subject: copy.signupSubject,
    html: rendered.html,
    text: rendered.text,
  };
};

export const buildPilgrimOrderTemplate = (input: ReservationTemplateInput): EmailTemplateResult => {
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
      {
        title: copy.reservationBlockTitle,
        rows: buildReservationDetailsRows(copy, input),
      },
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

  return {
    subject: copy.pilgrimOrderSubject,
    html: rendered.html,
    text: rendered.text,
  };
};

export const buildGuideBookingTemplate = (input: ReservationTemplateInput): EmailTemplateResult => {
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
      {
        title: copy.reservationBlockTitle,
        rows: buildReservationDetailsRows(copy, input),
      },
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

  return {
    subject: copy.guideBookingSubject,
    html: rendered.html,
    text: rendered.text,
  };
};
