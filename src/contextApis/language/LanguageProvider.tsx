import i18n, { t } from '@core/i18n';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { storageService } from '@core/storage/storageService';
import {
  LANGUAGE_OPTIONS,
  LanguageContext,
  type AppLanguage,
} from './LanguageContext';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    storageService.getItem<AppLanguage>(STORAGE_KEYS.LANGUAGE)
      .then(savedLanguage => {
        if (savedLanguage === 'en') {
          i18n.locale = savedLanguage;
          setLanguageState(savedLanguage);
        }
      })
      .catch(() => undefined);
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    i18n.locale = nextLanguage;
    setLanguageState(nextLanguage);
    storageService.setItem(STORAGE_KEYS.LANGUAGE, nextLanguage).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      language,
      options: LANGUAGE_OPTIONS,
      setLanguage,
      t,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
