import dayjs, { type Dayjs } from 'dayjs';
import { isOpenEndedRental } from '@core/constants/rental';
import type { Rental } from '@core/types/domain';

export interface RentalMonthBucket {
  month: number;
  monthLabel: string;
  timeline: MonthTimelineEntry[];
}

export type MonthTimelineEntry =
  | { kind: 'rental'; rental: Rental }
  | { kind: 'free'; start: string; end: string };

/** Rentals overlapping [monthStart, monthEnd] (inclusive by calendar day). */
export const rentalsForCalendarMonth = (
  rentals: Rental[],
  year: number,
  month: number,
): Rental[] => {
  const monthStart = dayjs().year(year).month(month - 1).startOf('month');
  const monthEnd = monthStart.endOf('month');

  return rentals
    .filter(r => {
      const start = dayjs(r.startDate);
      const end = isOpenEndedRental(r.endDate) ? monthEnd : dayjs(r.endDate);
      return !end.isBefore(monthStart, 'day') && !start.isAfter(monthEnd, 'day');
    })
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());
};

const clipToMonth = (rental: Rental, monthStart: Dayjs, monthEnd: Dayjs): { start: Dayjs; end: Dayjs } => {
  const rawEnd = isOpenEndedRental(rental.endDate) ? monthEnd : dayjs(rental.endDate);
  const start = dayjs(rental.startDate);
  return {
    start: start.isBefore(monthStart) ? monthStart : start,
    end: rawEnd.isAfter(monthEnd) ? monthEnd : rawEnd,
  };
};

/** Rentals and free windows within a calendar month, in chronological order. */
export const buildMonthTimeline = (
  rentals: Rental[],
  year: number,
  month: number,
): MonthTimelineEntry[] => {
  const monthStart = dayjs().year(year).month(month - 1).startOf('month');
  const monthEnd = monthStart.endOf('month').endOf('day');
  const monthRentals = rentalsForCalendarMonth(rentals, year, month);

  if (monthRentals.length === 0) {
    return [];
  }

  const timeline: MonthTimelineEntry[] = [];
  let cursor = monthStart;

  for (const rental of monthRentals) {
    const { start: rentStart, end: rentEnd } = clipToMonth(rental, monthStart, monthEnd);

    if (rentStart.isAfter(cursor, 'minute')) {
      timeline.push({
        kind: 'free',
        start: cursor.toISOString(),
        end: rentStart.toISOString(),
      });
    }

    timeline.push({ kind: 'rental', rental });
    const nextCursor = rentEnd.add(1, 'minute');
    cursor = nextCursor.isAfter(cursor) ? nextCursor : cursor;
  }

  if (cursor.isBefore(monthEnd, 'minute')) {
    timeline.push({
      kind: 'free',
      start: cursor.toISOString(),
      end: monthEnd.toISOString(),
    });
  }

  return timeline;
};

export const buildMonthlyRentalBuckets = (
  rentals: Rental[],
  year: number,
  monthNames: string[],
  now: Dayjs = dayjs(),
): RentalMonthBucket[] => {
  const maxMonth = year < now.year() ? 12 : now.month() + 1;
  const buckets: RentalMonthBucket[] = [];

  for (let month = 1; month <= maxMonth; month += 1) {
    const timeline = buildMonthTimeline(rentals, year, month);
    if (timeline.length === 0) {
      continue;
    }
    buckets.push({
      month,
      monthLabel: monthNames[month - 1] ?? String(month),
      timeline,
    });
  }

  return buckets.reverse();
};

export const earliestRentalYear = (rentals: Rental[], fallbackYear: number): number => {
  if (rentals.length === 0) {
    return fallbackYear;
  }
  return rentals.reduce(
    (min, r) => Math.min(min, dayjs(r.startDate).year()),
    dayjs(rentals[0]!.startDate).year(),
  );
};

/** Years to offer in the history year picker (newest first). */
export const summarizeMonthTimeline = (
  timeline: MonthTimelineEntry[],
): { rentalCount: number; freeCount: number } => ({
  rentalCount: timeline.filter(e => e.kind === 'rental').length,
  freeCount: timeline.filter(e => e.kind === 'free').length,
});

export const monthTimelineKey = (year: number, month: number): string => `${year}-${month}`;

export const buildHistoryYearOptions = (
  rentals: Rental[],
  currentYear: number = dayjs().year(),
): number[] => {
  const earliest = earliestRentalYear(rentals, currentYear);
  const years: number[] = [];
  for (let year = currentYear; year >= earliest; year -= 1) {
    years.push(year);
  }
  return years;
};
