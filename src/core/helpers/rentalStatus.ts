import dayjs from 'dayjs';
import { isOpenEndedRental } from '@core/constants/rental';
import type { Rental } from '@core/types/domain';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const rentalBoundary = (
  value: string,
  boundary: 'start' | 'end',
): dayjs.Dayjs => {
  const parsed = dayjs(value);

  if (!DATE_ONLY_PATTERN.test(value)) {
    return parsed;
  }

  return boundary === 'start' ? parsed.startOf('day') : parsed.endOf('day');
};

export const rentalStartsInFuture = (
  rental: Rental,
  now: dayjs.Dayjs = dayjs(),
): boolean =>
  rental.status !== 'COMPLETED' &&
  now.isBefore(rentalBoundary(rental.startDate, 'start'));

export const rentalIsCurrent = (
  rental: Rental,
  now: dayjs.Dayjs = dayjs(),
): boolean => {
  if (rental.status === 'COMPLETED') {
    return false;
  }

  const start = rentalBoundary(rental.startDate, 'start');
  const end = isOpenEndedRental(rental.endDate)
    ? dayjs(rental.endDate)
    : rentalBoundary(rental.endDate, 'end');

  return !now.isBefore(start) && !now.isAfter(end);
};
