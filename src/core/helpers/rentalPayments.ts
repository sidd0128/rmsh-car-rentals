import type { Car, PaymentRecord, Rental } from '@core/types/domain';
import { installmentDueDay, sortPaymentsByDueDate } from './paymentInstallment';

export type NextRentDue = {
  amount: number;
  dueDate: string;
};

export const paymentsForRental = (
  rentalId: string,
  payments: PaymentRecord[],
): PaymentRecord[] =>
  payments
    .filter(p => p.rentalId === rentalId)
    .sort(
      (a, b) =>
        (a.installmentIndex ?? 1) - (b.installmentIndex ?? 1) ||
        installmentDueDay(a).valueOf() - installmentDueDay(b).valueOf(),
    );

/** Amount actually received for a rental (sum of completed installment payments). */
export const paidAmountForRental = (
  rental: Rental,
  payments: PaymentRecord[],
): number =>
  paymentsForRental(rental.id, payments)
    .filter(p => p.status === 'DONE')
    .reduce((sum, p) => sum + p.amount, 0);

export const deriveRentalPaymentStatus = (
  rentalPayments: PaymentRecord[],
): Rental['paymentStatus'] => {
  if (rentalPayments.length === 0) {
    return 'PENDING';
  }
  if (rentalPayments.some(p => p.status === 'NOT_PAID')) {
    return 'PENDING';
  }
  return rentalPayments.every(p => p.status === 'DONE') ? 'DONE' : 'PENDING';
};

export const computeFleetTotalPaid = (
  rentals: Rental[],
  payments: PaymentRecord[],
): number =>
  rentals.reduce((sum, rental) => sum + paidAmountForRental(rental, payments), 0);

export const computeCarTotalPaid = (
  carId: string,
  rentals: Rental[],
  payments: PaymentRecord[],
): number =>
  rentals
    .filter(r => r.carId === carId)
    .reduce((sum, rental) => sum + paidAmountForRental(rental, payments), 0);

/** Earliest pending installment for a car (active or upcoming contract). */
export const nextPendingInstallmentForCar = (
  carId: string,
  payments: PaymentRecord[],
): PaymentRecord | undefined =>
  sortPaymentsByDueDate(
    payments.filter(p => p.carId === carId && p.status === 'PENDING'),
  )[0];

/** Next rent line item for on-rent cars; null when nothing is due. */
export const getNextRentDueForCar = (
  car: Pick<Car, 'id' | 'status'>,
  payments: PaymentRecord[],
): NextRentDue | null => {
  if (car.status !== 'ON_RENT') {
    return null;
  }
  const next = nextPendingInstallmentForCar(car.id, payments);
  if (!next) {
    return null;
  }
  return {
    amount: next.amount,
    dueDate: next.dueDate ?? next.createdAt,
  };
};

export const computeCustomerTotalPaid = (
  customerId: string,
  rentals: Rental[],
  payments: PaymentRecord[],
): number =>
  rentals
    .filter(r => r.customerId === customerId)
    .reduce((sum, rental) => sum + paidAmountForRental(rental, payments), 0);
