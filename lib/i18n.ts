import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import frCommon from '@/locales/fr/common.json';
import frAuth from '@/locales/fr/auth.json';
import frTabs from '@/locales/fr/tabs.json';
import frProfile from '@/locales/fr/profile.json';
import frHome from '@/locales/fr/home.json';
import frBooking from '@/locales/fr/booking.json';
import frGuide from '@/locales/fr/guide.json';
import frContent from '@/locales/fr/content.json';
import frLegal from '@/locales/fr/legal.json';
import frSupport from '@/locales/fr/support.json';
import frMessages from '@/locales/fr/messages.json';

import arCommon from '@/locales/ar/common.json';
import arAuth from '@/locales/ar/auth.json';
import arTabs from '@/locales/ar/tabs.json';
import arProfile from '@/locales/ar/profile.json';
import arHome from '@/locales/ar/home.json';
import arBooking from '@/locales/ar/booking.json';
import arGuide from '@/locales/ar/guide.json';
import arContent from '@/locales/ar/content.json';
import arLegal from '@/locales/ar/legal.json';
import arSupport from '@/locales/ar/support.json';
import arMessages from '@/locales/ar/messages.json';

import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enTabs from '@/locales/en/tabs.json';
import enProfile from '@/locales/en/profile.json';
import enHome from '@/locales/en/home.json';
import enBooking from '@/locales/en/booking.json';
import enGuide from '@/locales/en/guide.json';
import enContent from '@/locales/en/content.json';
import enLegal from '@/locales/en/legal.json';
import enSupport from '@/locales/en/support.json';
import enMessages from '@/locales/en/messages.json';

export type AppLanguage = 'fr' | 'ar' | 'en';

export const defaultNS = 'common';

export const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    tabs: frTabs,
    profile: frProfile,
    home: frHome,
    booking: frBooking,
    guide: frGuide,
    content: frContent,
    legal: frLegal,
    support: frSupport,
    messages: frMessages,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    tabs: arTabs,
    profile: arProfile,
    home: arHome,
    booking: arBooking,
    guide: arGuide,
    content: arContent,
    legal: arLegal,
    support: arSupport,
    messages: arMessages,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    tabs: enTabs,
    profile: enProfile,
    home: enHome,
    booking: enBooking,
    guide: enGuide,
    content: enContent,
    legal: enLegal,
    support: enSupport,
    messages: enMessages,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  defaultNS,
  ns: ['common', 'auth', 'tabs', 'profile', 'home', 'booking', 'guide', 'content', 'legal', 'support', 'messages'],
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export default i18n;
