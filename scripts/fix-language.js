const fs = require('fs');

const file = 'context/LanguageContext.tsx';
let content = fs.readFileSync(file, 'utf-8');

const applyLanguageBlock = `  const applyLanguage = useCallback(async (
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
  }, []);`;

content = content.replace(applyLanguageBlock, '');
content = content.replace(
  '  // Bootstrap: resolve language from cache → profile → device → fallback',
  applyLanguageBlock + '\n\n  // Bootstrap: resolve language from cache → profile → device → fallback'
);

fs.writeFileSync(file, content);
