import i18n from '@core/i18n';
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

export const pendingAmountForRental = (
  rental: Rental,
  payments: PaymentRecord[],
): number =>
  paymentsForRental(rental.id, payments)
    .filter(p => p.status === 'PENDING')
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

export const rentalPaymentProgressLabel = (
  rentalId: string,
  payments: PaymentRecord[],
): string => {
  const rentalPayments = paymentsForRental(rentalId, payments);
  if (rentalPayments.length === 0) {
    return i18n.t('rentals.noPaymentSchedule');
  }
  const notPaid = rentalPayments.filter(p => p.status === 'NOT_PAID').length;
  if (notPaid > 0) {
    return i18n.t('rentals.paymentsNotPaid', { count: notPaid });
  }
  const paid = rentalPayments.filter(p => p.status === 'DONE').length;
  const total = rentalPayments.length;
  if (total === 1) {
    return rentalPayments[0].status === 'DONE'
      ? i18n.t('rentals.paidInFull')
      : i18n.t('rentals.paymentPending');
  }
  return i18n.t('rentals.paymentsReceived', { paid, total });
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
