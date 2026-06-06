import i18n, { t } from '@core/i18n';
import React, { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LanguageContext, type AppLanguage } from './LanguageContext';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    i18n.locale = nextLanguage;
    setLanguageState(nextLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
