import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@locales/en.json';

export const DEFAULT_LOCALE = 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export { useTranslation } from 'react-i18next';
export default i18n;
