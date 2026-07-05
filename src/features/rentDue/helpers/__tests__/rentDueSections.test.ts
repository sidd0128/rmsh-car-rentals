import type { PaymentRecord, Rental } from '@core/types/domain';
import { getRentDayRosterItems, groupRentRosterByWeekday } from '../rentDueSections';

const rental = (overrides: Partial<Rental> & Pick<Rental, 'id'>): Rental => ({
  carId: 'car1',
  customerId: 'c1',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-31T00:00:00.000Z',
  agreedPrice: 100,
  paymentStatus: 'PENDING',
  status: 'ACTIVE',
  billingFrequency: 'WEEKLY',
  rateAmount: 100,
  rentDueWeekday: 1,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

const payment = (
  overrides: Partial<PaymentRecord> & Pick<PaymentRecord, 'id' | 'rentalId'>,
): PaymentRecord => ({
  customerId: 'c1',
  carId: 'car1',
  amount: 100,
  status: 'PENDING',
  dueDate: '2026-07-01',
  installmentIndex: 1,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('rentDueSections', () => {
  it('uses active rentals with selected rent weekdays as the roster source', () => {
    const rentals = [
      rental({ id: 'active-monday', rentDueWeekday: 1 }),
      rental({ id: 'upcoming-monday', status: 'UPCOMING', rentDueWeekday: 1 }),
      rental({ id: 'active-no-weekday', rentDueWeekday: undefined }),
    ];
    const payments = [payment({ id: 'p1', rentalId: 'active-monday' })];

    const roster = getRentDayRosterItems(rentals, payments);

    expect(roster).toHaveLength(1);
    expect(roster[0].rental.id).toBe('active-monday');
    expect(roster[0].nextPayment?.id).toBe('p1');
  });

  it('groups roster customers by the weekday selected on assignment', () => {
    const rentals = [
      rental({ id: 'monday', rentDueWeekday: 1 }),
      rental({ id: 'wednesday', rentDueWeekday: 3 }),
    ];
    const payments = [
      payment({ id: 'p1', rentalId: 'monday' }),
      payment({ id: 'p2', rentalId: 'wednesday' }),
    ];

    const sections = groupRentRosterByWeekday(rentals, payments);

    expect(sections).toHaveLength(2);
    expect(sections[0].weekdayIndex).toBe(1);
    expect(sections[0].items[0].rental.id).toBe('monday');
    expect(sections[1].weekdayIndex).toBe(3);
    expect(sections[1].items[0].rental.id).toBe('wednesday');
  });
});
