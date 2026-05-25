import { hasBookingConflict } from '../bookingConflictService';
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
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-10T00:00:00.000Z',
      }),
    ];
    const conflict = hasBookingConflict(rentals, {
      startDate: '2026-02-05T00:00:00.000Z',
      endDate: '2026-02-15T00:00:00.000Z',
    });
    expect(conflict).toBe(true);
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
});
