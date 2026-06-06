import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import type { LanguageContextValue } from './LanguageContext';

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
