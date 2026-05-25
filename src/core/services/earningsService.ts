import type { PaymentRecord, Rental } from '../types/domain';

export const calculateTotalEarnings = (payments: PaymentRecord[]): number =>
  payments.filter(p => p.status === 'DONE').reduce((sum, p) => sum + p.amount, 0);

export const calculateRentalEarnings = (
  rentals: Rental[],
  payments: PaymentRecord[],
): number => {
  const rentalIds = new Set(rentals.map(r => r.id));
  return payments
    .filter(p => rentalIds.has(p.rentalId) && p.status === 'DONE')
    .reduce((sum, p) => sum + p.amount, 0);
};

export const earningsService = {
  calculateTotalEarnings,
  calculateRentalEarnings,
};
