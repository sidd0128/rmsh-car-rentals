import dayjs, { type Dayjs } from 'dayjs';
import type { PaymentRecord, PaymentStatus } from '@core/types/domain';
import { formatDate } from './date';

export type PaymentInstallmentAction = 'received' | 'not_paid';

/** Calendar day when an installment is due (falls back to createdAt for legacy rows). */
export const installmentDueDay = (
  payment: Pick<PaymentRecord, 'dueDate' | 'createdAt'>,
): Dayjs => dayjs(payment.dueDate ?? payment.createdAt).startOf('day');

export const formatInstallmentDueLabel = (
  payment: Pick<PaymentRecord, 'dueDate' | 'createdAt'>,
): string => `Rent due ${formatDate(payment.dueDate ?? payment.createdAt)}`;

export const sortPaymentsByDueDate = (
  payments: PaymentRecord[],
): PaymentRecord[] =>
  [...payments].sort(
    (a, b) => installmentDueDay(a).valueOf() - installmentDueDay(b).valueOf(),
  );

export const nextPendingInstallmentForCustomer = (
  customerId: string,
  payments: PaymentRecord[],
): PaymentRecord | undefined =>
  sortPaymentsByDueDate(
    payments.filter(p => p.customerId === customerId && p.status === 'PENDING'),
  )[0];

export const formatPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case 'DONE':
      return 'Received';
    case 'NOT_PAID':
      return 'Not paid';
    default:
      return 'Pending';
  }
};

export type PaymentStatusBadgeVariant = 'done' | 'pending' | 'not_paid';

export const paymentStatusToBadgeVariant = (
  status: PaymentStatus,
): PaymentStatusBadgeVariant => {
  switch (status) {
    case 'DONE':
      return 'done';
    case 'NOT_PAID':
      return 'not_paid';
    default:
      return 'pending';
  }
};

/** Due date for pending rows; paid date when received. */
export const formatPaymentHistoryDateLine = (
  payment: Pick<PaymentRecord, 'status' | 'dueDate' | 'createdAt' | 'paidAt'>,
): string => {
  if (payment.status === 'DONE' && payment.paidAt) {
    return `Paid ${formatDate(payment.paidAt)}`;
  }
  return `Due ${formatDate(payment.dueDate ?? payment.createdAt)}`;
};
