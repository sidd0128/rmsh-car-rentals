import dayjs from 'dayjs';
import type { Rental } from '../types/domain';

export interface DateRange {
  startDate: string;
  endDate: string;
}

const rangesOverlap = (a: DateRange, b: DateRange): boolean => {
  const aStart = dayjs(a.startDate);
  const aEnd = dayjs(a.endDate);
  const bStart = dayjs(b.startDate);
  const bEnd = dayjs(b.endDate);
  return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
};

export const hasBookingConflict = (
  rentals: Rental[],
  range: DateRange,
  excludeRentalId?: string,
): boolean =>
  rentals
    .filter(r => r.status !== 'COMPLETED' && r.id !== excludeRentalId)
    .some(r => rangesOverlap(range, { startDate: r.startDate, endDate: r.endDate }));

export const bookingConflictService = { hasBookingConflict, rangesOverlap };
