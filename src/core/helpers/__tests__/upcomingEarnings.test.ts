import dayjs from 'dayjs';
import {
  groupPendingPaymentsByMonthForYear,
  getUpcomingEarningsYearOptions,
} from '../upcomingEarnings';
import type { PaymentRecord } from '@core/types/domain';

const pending = (
  overrides: Partial<PaymentRecord> & Pick<PaymentRecord, 'id'>,
): PaymentRecord => ({
  rentalId: 'r1',
  customerId: 'c1',
  carId: 'car1',
  amount: 100,
  status: 'PENDING',
  dueDate: '2026-03-15',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('upcomingEarnings', () => {
  it('groups pending payments only into months that have due installments', () => {
    const payments = [
      pending({ id: 'p1', dueDate: '2026-01-10', amount: 50 }),
      pending({ id: 'p2', dueDate: '2026-03-20', amount: 75 }),
    ];
    const sections = groupPendingPaymentsByMonthForYear(payments, 2026);
    expect(sections).toHaveLength(2);
    expect(sections[0].payments).toHaveLength(1);
    expect(sections[1].payments).toHaveLength(1);
    expect(sections[0].title).toBe(dayjs('2026-01-01').format('MMMM YYYY'));
    expect(sections[1].title).toBe(dayjs('2026-03-01').format('MMMM YYYY'));
  });

  it('includes current year in year options', () => {
    const years = getUpcomingEarningsYearOptions([]);
    expect(years).toContain(dayjs().year());
  });
});
