import { createContext } from 'react';
import type { TranslateOptions } from '@core/i18n';

export type AppLanguage = 'en';

export type LanguageOption = {
  label: string;
  value: AppLanguage;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: 'English', value: 'en' },
];

export interface LanguageContextValue {
  language: AppLanguage;
  options: LanguageOption[];
  setLanguage: (language: AppLanguage) => void;
  t: (scope: string, options?: TranslateOptions) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
