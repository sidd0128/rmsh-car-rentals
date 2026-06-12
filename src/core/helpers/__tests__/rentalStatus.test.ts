import dayjs from 'dayjs';
import { rentalIsCurrent, rentalStartsInFuture } from '../rentalStatus';
import type { Rental } from '@core/types/domain';

const rental = (overrides: Partial<Rental> = {}): Rental => ({
  id: 'r1',
  carId: 'car1',
  customerId: 'customer1',
  startDate: '2026-06-01T10:00:00.000Z',
  endDate: '2026-06-11T00:29:00.000Z',
  agreedPrice: 100,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('rentalStatus', () => {
  it('does not treat stale ACTIVE rentals as current after their exact end time', () => {
    expect(
      rentalIsCurrent(rental(), dayjs('2026-06-12T08:33:00.000Z')),
    ).toBe(false);
  });

  it('treats date-only end dates as active until the end of that day', () => {
    expect(
      rentalIsCurrent(
        rental({
          startDate: '2026-06-01',
          endDate: '2026-06-11',
        }),
        dayjs('2026-06-11T23:59:00.000'),
      ),
    ).toBe(true);
  });

  it('detects non-completed rentals that start in the future', () => {
    expect(
      rentalStartsInFuture(
        rental({ startDate: '2026-06-13T10:00:00.000Z' }),
        dayjs('2026-06-12T08:33:00.000Z'),
      ),
    ).toBe(true);
  });
});
