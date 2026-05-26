import type { PaymentRecord } from '@core/types/domain';

/** True when the customer has at least one installment marked not paid. */
export const customerHasNotPaidInstallment = (
  customerId: string,
  payments: PaymentRecord[],
): boolean => payments.some(p => p.customerId === customerId && p.status === 'NOT_PAID');
