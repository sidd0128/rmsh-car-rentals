import { createContext } from 'react';
import type { TranslateOptions } from '@core/i18n';

export type AppLanguage = 'en';

export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (scope: string, options?: TranslateOptions) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
