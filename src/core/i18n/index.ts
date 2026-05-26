/**
 * i18n setup (Avy-style: i18n-js + locale JSON files).
 * @see https://github.com/fnando/i18n-js
 */
import { I18n } from 'i18n-js';
import en from '@locales/en.json';

const i18n = new I18n({ en });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = 'en';

/** Match `{{name}}` placeholders used in en.json (i18next-style). */
i18n.placeholder = /\{\{(\w+)\}\}/g;

export type TranslateOptions = Record<string, string | number | boolean>;

/** Translate outside React (navigation titles, helpers, alerts). */
export const t = (scope: string, options?: TranslateOptions): string =>
  String(i18n.t(scope, options));

/**
 * Hook-shaped API for screens (same call sites as before).
 * Subscribe with `i18n.onChange` when you add a language picker.
 */
export const useTranslation = () => ({
  t,
  i18n,
});

export default i18n;
