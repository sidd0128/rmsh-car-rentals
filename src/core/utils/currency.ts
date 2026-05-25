import { CURRENCY_LOCALE, DEFAULT_CURRENCY } from '../constants/app';

export const formatCurrency = (amount: number, currency = DEFAULT_CURRENCY): string =>
  new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
