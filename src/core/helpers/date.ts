/**
 * Shared date formatting and ISO helpers (dayjs).
 */
import dayjs from 'dayjs';

export const formatDate = (date: string, format = 'DD MMM YYYY'): string =>
  dayjs(date).format(format);

export const formatDateTime = (date: string): string =>
  dayjs(date).format('DD MMM YYYY, HH:mm');

export const formatDateTimeAmPm = (date: string): string =>
  dayjs(date).format('D MMM YYYY h:mm A');

export const todayISO = (): string => dayjs().toISOString();
