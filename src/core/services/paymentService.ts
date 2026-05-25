import type { Customer, PaymentRecord, Rental } from '../types/domain';

export const getCustomerPaymentSummary = (
  customerId: string,
  rentals: Rental[],
  payments: PaymentRecord[],
) => {
  const customerRentals = rentals.filter(r => r.customerId === customerId);
  const rentalIds = new Set(customerRentals.map(r => r.id));
  const customerPayments = payments.filter(p => rentalIds.has(p.rentalId));

  const pending = customerPayments.filter(p => p.status === 'PENDING').length;
  const done = customerPayments.filter(p => p.status === 'DONE').length;
  const pendingAmount = customerPayments
    .filter(p => p.status === 'PENDING')
    .reduce((s, p) => s + p.amount, 0);
  const paidAmount = customerPayments
    .filter(p => p.status === 'DONE')
    .reduce((s, p) => s + p.amount, 0);

  return { pending, done, pendingAmount, paidAmount, total: customerPayments.length };
};

export const getOverdueRentals = (rentals: Rental[]): Rental[] => {
  const now = new Date().toISOString();
  return rentals.filter(
    r => r.status === 'ACTIVE' && r.endDate < now && r.paymentStatus === 'PENDING',
  );
};

export const syncCustomerTotals = (customer: Customer, rentals: Rental[]): Customer => ({
  ...customer,
  totalRentals: rentals.filter(r => r.customerId === customer.id).length,
});

export const paymentService = {
  getCustomerPaymentSummary,
  getOverdueRentals,
  syncCustomerTotals,
};
