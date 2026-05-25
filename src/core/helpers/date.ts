import dayjs from 'dayjs';

export const formatDate = (date: string, format = 'DD MMM YYYY'): string =>
  dayjs(date).format(format);

export const formatDateTime = (date: string): string =>
  dayjs(date).format('DD MMM YYYY, HH:mm');

export const isAfter = (a: string, b: string): boolean => dayjs(a).isAfter(dayjs(b));

export const isBefore = (a: string, b: string): boolean => dayjs(a).isBefore(dayjs(b));

export const isBetween = (date: string, start: string, end: string): boolean => {
  const d = dayjs(date);
  return d.isAfter(dayjs(start)) && d.isBefore(dayjs(end)) || d.isSame(start) || d.isSame(end);
};

export const todayISO = (): string => dayjs().toISOString();

export const addDays = (date: string, days: number): string =>
  dayjs(date).add(days, 'day').toISOString();
