import i18n from '@core/i18n';
import { paymentsForRental } from '@core/helpers/rentalPayments';
import type { PaymentRecord, Rental } from '@core/types/domain';

export type RentDueRosterItem = {
  rental: Rental;
  nextPayment?: PaymentRecord;
};

export type RentDueDaySection = {
  key: string;
  weekdayIndex: number;
  title: string;
  items: RentDueRosterItem[];
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

const nextPendingPaymentForRental = (
  rentalId: string,
  payments: PaymentRecord[],
): PaymentRecord | undefined =>
  paymentsForRental(rentalId, payments).find(payment => payment.status === 'PENDING');

export const getRentDayRosterItems = (
  rentals: Rental[],
  payments: PaymentRecord[],
): RentDueRosterItem[] =>
  rentals
    .filter(rental => rental.status === 'ACTIVE' && rental.rentDueWeekday != null)
    .map(rental => ({
      rental,
      nextPayment: nextPendingPaymentForRental(rental.id, payments),
    }));

export const groupRentRosterByWeekday = (
  rentals: Rental[],
  payments: PaymentRecord[],
): RentDueDaySection[] => {
  const byWeekday = new Map<number, RentDueRosterItem[]>();

  for (const item of getRentDayRosterItems(rentals, payments)) {
    const weekdayIndex = item.rental.rentDueWeekday;
    if (weekdayIndex == null) {
      continue;
    }
    const bucket = byWeekday.get(weekdayIndex) ?? [];
    bucket.push(item);
    byWeekday.set(weekdayIndex, bucket);
  }

  return [...byWeekday.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekdayIndex, items]) => ({
      key: `weekday-${weekdayIndex}`,
      weekdayIndex,
      title: weekdayTitle(weekdayIndex),
      items,
    }));
};
