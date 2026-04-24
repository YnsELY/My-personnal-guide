import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { reloadAppAsync } from 'expo';
import { DevSettings, I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import i18n, { type AppLanguage } from '@/lib/i18n';
import { persistentStorage } from '@/lib/persistentStorage';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'app.language';

type FormatOptions = Intl.DateTimeFormatOptions;

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  isRTL: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  formatDate: (date: Date | string | number) => string;
  formatTime: (date: Date | string | number) => string;
  formatDateTime: (date: Date | string | number) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

function getLocale(lang: AppLanguage): string {
  if (lang === 'ar') return 'ar-SA';
  if (lang === 'en') return 'en-US';
  return 'fr-FR';
}

async function reloadForDirectionChange() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  try {
    await reloadAppAsync();
    return;
  } catch {}

  try {
    DevSettings.reload('RTL direction change');
  } catch {}
}

function resolveDeviceLanguage(): AppLanguage {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode;
    if (code?.startsWith('ar')) return 'ar';
    if (code?.startsWith('en')) return 'en';
  } catch {}
  return 'fr';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [language, setLanguageState] = useState<AppLanguage>('fr');
  const [isReady, setIsReady] = useState(false);

  // Bootstrap: resolve language from cache → profile → device → fallback
  useEffect(() => {
    (async () => {
      let resolved: AppLanguage = 'fr';

      // 1. Cache local
      const cached = await persistentStorage.getItemAsync(STORAGE_KEY);
      if (cached === 'fr' || cached === 'ar' || cached === 'en') {
        resolved = cached as AppLanguage;
      } else {
        // 2. Profile language (if logged in)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('language')
              .eq('id', user.id)
              .single();
            if (profile?.language === 'fr' || profile?.language === 'ar' || profile?.language === 'en') {
              resolved = profile.language as AppLanguage;
            }
          }
        } catch {}

        // 3. Device language
        if (!cached) {
          const deviceLang = resolveDeviceLanguage();
          if (resolved === 'fr') resolved = deviceLang;
        }
      }

      await applyLanguage(resolved, { persist: false, allowReload: true });
      setIsReady(true);
    })();
  }, [applyLanguage]);

  const applyLanguage = useCallback(async (
    lang: AppLanguage,
    options?: { persist?: boolean; allowReload?: boolean }
  ) => {
    const persist = options?.persist ?? true;
    const allowReload = options?.allowReload ?? true;
    const shouldBeRTL = lang === 'ar';
    const needsDirectionReload = I18nManager.isRTL !== shouldBeRTL;

    await i18n.changeLanguage(lang);
    setLanguageState(lang);

    if (persist) {
      await persistentStorage.setItemAsync(STORAGE_KEY, lang);
    }

    if (needsDirectionReload) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);

      if (allowReload) {
        await reloadForDirectionChange();
      }
    }
  }, []);

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    await applyLanguage(lang, { persist: true, allowReload: true });

    // Sync to profile + auth metadata (fire and forget)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ language: lang }).eq('id', user.id);
        await supabase.auth.updateUser({ data: { language: lang } });
      }
    } catch {}
  }, [applyLanguage]);

  const isRTL = language === 'ar';
  const locale = getLocale(language);

  const formatDate = useCallback((date: Date | string | number) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }, [locale]);

  const formatTime = useCallback((date: Date | string | number) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }, [locale]);

  const formatDateTime = useCallback((date: Date | string | number) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [locale]);

  const formatCurrency = useCallback((value: number, currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Math.max(0, value));
  }, [locale]);

  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t, formatDate, formatTime, formatDateTime, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}
