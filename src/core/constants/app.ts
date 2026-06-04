import i18n from '@core/i18n';

export const getAppName = (): string => i18n.t('app.name');

export const MAX_CAR_IMAGES = 4;
export const DEFAULT_CURRENCY = 'AUD';
export const CURRENCY_LOCALE = 'en-AU';

export const currencyFieldLabel = (label: string): string =>
  i18n.t('common.currencyFieldLabel', {
    label,
    currency: DEFAULT_CURRENCY,
  });
