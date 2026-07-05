import dayjs from 'dayjs';
import type { PaymentRecord } from '@core/types/domain';
import {
  computeDueRentTotal,
  getDuePendingRentPayments,
  groupDueRentPaymentsByWeekday,
} from '../rentDueSections';

const pending = (
  overrides: Partial<PaymentRecord> & Pick<PaymentRecord, 'id'>,
): PaymentRecord => ({
  rentalId: 'r1',
  customerId: 'c1',
  carId: 'car1',
  amount: 100,
  status: 'PENDING',
  dueDate: '2026-07-01',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

describe('rentDueSections', () => {
  it('returns only pending payments due today or earlier', () => {
    const payments = [
      pending({ id: 'overdue', dueDate: '2026-07-01', amount: 50 }),
      pending({ id: 'today', dueDate: '2026-07-05', amount: 75 }),
      pending({ id: 'future', dueDate: '2026-07-06', amount: 100 }),
      pending({ id: 'paid', dueDate: '2026-07-05', status: 'DONE' }),
    ];

    const due = getDuePendingRentPayments(payments, '2026-07-05');

    expect(due.map(payment => payment.id)).toEqual(['overdue', 'today']);
    expect(computeDueRentTotal(payments, '2026-07-05')).toBe(125);
  });

  it('groups due payments by their scheduled weekday', () => {
    const payments = [
      pending({ id: 'wednesday', dueDate: '2026-07-01', amount: 50 }),
      pending({ id: 'sunday', dueDate: '2026-07-05', amount: 75 }),
    ];

    const sections = groupDueRentPaymentsByWeekday(payments, '2026-07-05');

    expect(sections).toHaveLength(2);
    expect(sections[0].weekdayIndex).toBe(dayjs('2026-07-05').day());
    expect(sections[0].payments[0].id).toBe('sunday');
    expect(sections[1].weekdayIndex).toBe(dayjs('2026-07-01').day());
    expect(sections[1].payments[0].id).toBe('wednesday');
  });
});
