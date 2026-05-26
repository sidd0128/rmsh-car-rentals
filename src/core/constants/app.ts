import i18n from '@core/i18n';

export const getAppName = (): string => i18n.t('app.name');

/** @deprecated Use getAppName() for translated app name. Kept for static imports during init. */
export const APP_NAME = 'RMSH Rentals';

export const MAX_CAR_IMAGES = 4;
export const DEFAULT_CURRENCY = 'AUD';
export const CURRENCY_LOCALE = 'en-AU';

export const currencyFieldLabel = (label: string): string =>
  i18n.t('common.currencyFieldLabel', {
    label,
    currency: DEFAULT_CURRENCY,
  });
