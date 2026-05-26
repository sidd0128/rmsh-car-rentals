import dayjs from 'dayjs';
import type { PaymentRecord } from '@core/types/domain';
import { installmentDueDay } from './paymentInstallment';

/** Pending installments with rent due in the given calendar year. */
const getPendingPaymentsInYear = (
  payments: PaymentRecord[],
  year: number,
): PaymentRecord[] =>
  payments
    .filter(p => p.status === 'PENDING')
    .filter(p => installmentDueDay(p).year() === year)
    .sort((a, b) => installmentDueDay(a).valueOf() - installmentDueDay(b).valueOf());

export const computeUpcomingEarningsTotalForYear = (
  payments: PaymentRecord[],
  year: number,
): number => getPendingPaymentsInYear(payments, year).reduce((sum, p) => sum + p.amount, 0);

export type UpcomingEarningsMonthSection = {
  key: string;
  title: string;
  year: number;
  monthIndex: number;
  payments: PaymentRecord[];
  totalAmount: number;
};

/** Months in a year that have pending installments, in calendar order. */
export const groupPendingPaymentsByMonthForYear = (
  payments: PaymentRecord[],
  year: number,
): UpcomingEarningsMonthSection[] => {
  const byMonth = new Map<number, PaymentRecord[]>();
  for (const payment of getPendingPaymentsInYear(payments, year)) {
    const monthIndex = installmentDueDay(payment).month();
    const bucket = byMonth.get(monthIndex) ?? [];
    bucket.push(payment);
    byMonth.set(monthIndex, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([monthIndex, monthPayments]) => ({
      key: `${year}-${monthIndex}`,
      title: dayjs().year(year).month(monthIndex).format('MMMM YYYY'),
      year,
      monthIndex,
      payments: monthPayments,
      totalAmount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    }));
};

/** Years that have pending rent due, plus the current calendar year. */
export const getUpcomingEarningsYearOptions = (payments: PaymentRecord[]): number[] => {
  const years = new Set<number>([dayjs().year()]);
  payments
    .filter(p => p.status === 'PENDING')
    .forEach(p => years.add(installmentDueDay(p).year()));
  return [...years].sort((a, b) => b - a);
};
