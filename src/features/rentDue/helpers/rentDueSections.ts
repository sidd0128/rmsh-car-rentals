import dayjs from 'dayjs';
import i18n from '@core/i18n';
import { installmentDueDay, sortPaymentsByDueDate } from '@core/helpers/paymentInstallment';
import type { PaymentRecord } from '@core/types/domain';

export type RentDueDaySection = {
  key: string;
  weekdayIndex: number;
  title: string;
  totalAmount: number;
  payments: PaymentRecord[];
};

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const weekdayTitle = (weekdayIndex: number): string =>
  i18n.t(`billing.weekdays.${WEEKDAY_KEYS[weekdayIndex]}`);

export const getDuePendingRentPayments = (
  payments: PaymentRecord[],
  asOf: Date | string = new Date(),
): PaymentRecord[] => {
  const endOfToday = dayjs(asOf).endOf('day');
  return sortPaymentsByDueDate(
    payments.filter(
      payment =>
        payment.status === 'PENDING' &&
        !installmentDueDay(payment).isAfter(endOfToday, 'day'),
    ),
  );
};

export const groupDueRentPaymentsByWeekday = (
  payments: PaymentRecord[],
  asOf: Date | string = new Date(),
): RentDueDaySection[] => {
  const byWeekday = new Map<number, PaymentRecord[]>();

  for (const payment of getDuePendingRentPayments(payments, asOf)) {
    const weekdayIndex = installmentDueDay(payment).day();
    const bucket = byWeekday.get(weekdayIndex) ?? [];
    bucket.push(payment);
    byWeekday.set(weekdayIndex, bucket);
  }

  return [...byWeekday.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekdayIndex, dayPayments]) => ({
      key: `weekday-${weekdayIndex}`,
      weekdayIndex,
      title: weekdayTitle(weekdayIndex),
      payments: dayPayments,
      totalAmount: dayPayments.reduce((sum, payment) => sum + payment.amount, 0),
    }));
};

export const computeDueRentTotal = (
  payments: PaymentRecord[],
  asOf: Date | string = new Date(),
): number =>
  getDuePendingRentPayments(payments, asOf).reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
