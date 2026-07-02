import {
  findBookingConflict,
  hasBookingConflict,
} from '../bookingConflictService';
import type { Rental } from '../../types/domain';

const baseRental = (overrides: Partial<Rental>): Rental => ({
  id: '1',
  carId: 'car-1',
  customerId: 'cust-1',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-01-10T00:00:00.000Z',
  agreedPrice: 1000,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('bookingConflictService', () => {
  it('detects overlapping rentals', () => {
    const rentals = [
      baseRental({
        id: 'conflicting-rental',
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-10T00:00:00.000Z',
      }),
    ];
    const conflict = hasBookingConflict(rentals, {
      startDate: '2026-02-05T00:00:00.000Z',
      endDate: '2026-02-15T00:00:00.000Z',
    });
    expect(conflict).toBe(true);
    expect(
      findBookingConflict(rentals, {
        startDate: '2026-02-05T00:00:00.000Z',
        endDate: '2026-02-15T00:00:00.000Z',
      })?.id,
    ).toBe('conflicting-rental');
  });

  it('allows extension period starting on previous rental end date', () => {
    const rentals = [
      baseRental({
        id: 'original',
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-10T00:00:00.000Z',
      }),
    ];
    const conflict = hasBookingConflict(
      rentals,
      {
        startDate: '2026-02-10T00:00:00.000Z',
        endDate: '2026-02-20T00:00:00.000Z',
      },
      'original',
    );
    expect(conflict).toBe(false);
  });

  it('allows non-overlapping rentals', () => {
    const rentals = [
      baseRental({
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-10T00:00:00.000Z',
      }),
    ];
    const conflict = hasBookingConflict(rentals, {
      startDate: '2026-02-11T00:00:00.000Z',
      endDate: '2026-02-20T00:00:00.000Z',
    });
    expect(conflict).toBe(false);
  });

  it('allows a current-month rental before a later upcoming booking starts', () => {
    const rentals = [
      baseRental({
        status: 'UPCOMING',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T00:00:00.000Z',
      }),
    ];
    const conflict = hasBookingConflict(rentals, {
      startDate: '2026-07-02T00:00:00.000Z',
      endDate: '2026-07-31T23:59:59.000Z',
    });
    expect(conflict).toBe(false);
  });
});
