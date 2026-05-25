export const APP_NAME = 'RMSH Rentals';
export const SEED_VERSION = '1.0.0';
export const MAX_CAR_IMAGES = 4;
export const DEFAULT_CURRENCY = 'AUD';
export const CURRENCY_LOCALE = 'en-AU';

/** Form labels: e.g. currencyFieldLabel('Daily rate') → "Daily rate (AUD)" */
export const currencyFieldLabel = (label: string): string =>
  `${label} (${DEFAULT_CURRENCY})`;
