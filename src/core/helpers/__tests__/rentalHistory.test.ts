import dayjs from 'dayjs';
import {
  buildHistoryYearOptions,
  buildMonthTimeline,
  rentalsForCalendarMonth,
} from '../rentalHistory';
import type { Rental } from '@core/types/domain';

const rental = (partial: Partial<Rental> & Pick<Rental, 'id' | 'startDate' | 'endDate'>): Rental => ({
  carId: 'car1',
  customerId: 'c1',
  agreedPrice: 100,
  paymentStatus: 'PENDING',
  status: 'COMPLETED',
  createdAt: partial.startDate,
  updatedAt: partial.startDate,
  ...partial,
});

describe('rentalHistory', () => {
  it('builds year options from earliest rental through current year', () => {
    const rentals = [
      rental({
        id: 'r1',
        startDate: '2025-06-01T10:00:00.000Z',
        endDate: '2025-06-30T18:00:00.000Z',
      }),
      rental({
        id: 'r2',
        startDate: '2026-01-01T10:00:00.000Z',
        endDate: '2026-01-28T22:00:00.000Z',
      }),
    ];
    expect(buildHistoryYearOptions(rentals, 2026)).toEqual([2026, 2025]);
  });

  it('lists rentals overlapping a month', () => {
    const rentals = [
      rental({
        id: 'r1',
        startDate: '2026-01-01T10:00:00.000Z',
        endDate: '2026-01-28T22:00:00.000Z',
      }),
    ];
    expect(rentalsForCalendarMonth(rentals, 2026, 1)).toHaveLength(1);
    expect(rentalsForCalendarMonth(rentals, 2026, 2)).toHaveLength(0);
  });

  it('inserts free gaps between rentals in the same month', () => {
    const rentals = [
      rental({
        id: 'r1',
        startDate: '2026-01-01T10:00:00.000Z',
        endDate: '2026-01-10T18:00:00.000Z',
      }),
      rental({
        id: 'r2',
        startDate: '2026-01-15T09:00:00.000Z',
        endDate: '2026-01-28T22:00:00.000Z',
      }),
    ];
    const timeline = buildMonthTimeline(rentals, 2026, 1);
    const rentalsInTimeline = timeline.filter(e => e.kind === 'rental');
    const freeGaps = timeline.filter(e => e.kind === 'free');
    expect(rentalsInTimeline).toHaveLength(2);
    expect(freeGaps.length).toBeGreaterThanOrEqual(1);
    const betweenRentals = freeGaps.find(
      g =>
        dayjs(g.end).isAfter(dayjs('2026-01-10T18:00:00.000Z')) &&
        dayjs(g.start).isBefore(dayjs('2026-01-15T09:00:00.000Z')),
    );
    expect(betweenRentals).toBeDefined();
  });
});
