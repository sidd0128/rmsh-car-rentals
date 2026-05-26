import {
  getNextRentDueForCar,
  nextPendingInstallmentForCar,
} from '../rentalPayments';
import type { Car, PaymentRecord } from '@core/types/domain';

const payment = (
  overrides: Partial<PaymentRecord> & Pick<PaymentRecord, 'id' | 'carId'>,
): PaymentRecord => ({
  rentalId: 'r1',
  customerId: 'c1',
  amount: 100,
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('next rent due', () => {
  it('picks the earliest pending installment by due date', () => {
    const payments = [
      payment({ id: 'p2', carId: 'car1', dueDate: '2026-06-10', amount: 200 }),
      payment({ id: 'p1', carId: 'car1', dueDate: '2026-05-20', amount: 250 }),
    ];
    expect(nextPendingInstallmentForCar('car1', payments)?.id).toBe('p1');
  });

  it('returns next rent only for on-rent cars', () => {
    const carOnRent = { id: 'car1', status: 'ON_RENT' } as Car;
    const carAvailable = { id: 'car1', status: 'AVAILABLE' } as Car;
    const payments = [
      payment({ id: 'p1', carId: 'car1', dueDate: '2026-05-20', amount: 250 }),
    ];
    expect(getNextRentDueForCar(carOnRent, payments)).toEqual({
      amount: 250,
      dueDate: '2026-05-20',
    });
    expect(getNextRentDueForCar(carAvailable, payments)).toBeNull();
  });
});
