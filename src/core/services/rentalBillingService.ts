import i18n from '@core/i18n';
import dayjs, { type Dayjs } from 'dayjs';
import type { BillingFrequency } from '@core/types/domain';

export interface RentalInstallmentDraft {
  index: number;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  label: string;
}

export interface RentalBillingInput {
  startDate: string | Date;
  endDate: string | Date;
  frequency: BillingFrequency;
  rateAmount: number;
  /** 0 (Sun) – 6 (Sat); used when frequency is WEEKLY */
  rentDueWeekday?: number;
  /** 1–28; used when frequency is MONTHLY */
  rentDueDayOfMonth?: number;
}

export interface RentalBillingPreview {
  installments: RentalInstallmentDraft[];
  totalAmount: number;
  rentalDayCount: number;
}

const startOfDay = (value: string | Date): Dayjs => dayjs(value).startOf('day');

/** Calendar date for rent due (avoids UTC shift from toISOString). */
const toDueDateString = (value: Dayjs): string => value.format('YYYY-MM-DD');

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export const RENT_DUE_WEEKDAY_OPTIONS = WEEKDAY_KEYS.map((key, value) => {
  const label = i18n.t(`billing.weekdays.${key}`);
  return {
    value,
    label,
    shortLabel: label.slice(0, 3),
  };
});

/** Inclusive calendar days between start and end (minimum 1 when end >= start). */
export const countRentalDays = (startDate: string | Date, endDate: string | Date): number => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  if (end.isBefore(start)) {
    return 0;
  }
  return end.diff(start, 'day') + 1;
};

const clampDayOfMonth = (anchor: Dayjs, dayOfMonth: number): Dayjs => {
  const safeDay = Math.min(Math.max(1, dayOfMonth), 28);
  const daysInMonth = anchor.daysInMonth();
  return anchor.date(Math.min(safeDay, daysInMonth));
};

/** Pick the rent due date inside [periodStart, periodEnd] from weekday or month-day rules. */
export const resolveInstallmentDueDate = (
  periodStart: Dayjs,
  periodEnd: Dayjs,
  frequency: BillingFrequency,
  rentDueWeekday?: number,
  rentDueDayOfMonth?: number,
): Dayjs => {
  if (frequency === 'DAILY') {
    return periodStart;
  }

  if (frequency === 'WEEKLY' && rentDueWeekday != null) {
    let cursor = periodStart;
    while (cursor.isBefore(periodEnd, 'day') || cursor.isSame(periodEnd, 'day')) {
      if (cursor.day() === rentDueWeekday) {
        return cursor;
      }
      cursor = cursor.add(1, 'day');
    }
    // Partial week with no matching day: use nearest prior weekday (within 6 days).
    let back = periodStart.subtract(1, 'day');
    for (let i = 0; i < 6; i += 1) {
      if (back.day() === rentDueWeekday) {
        return back;
      }
      back = back.subtract(1, 'day');
    }
    return periodStart;
  }

  if (frequency === 'MONTHLY' && rentDueDayOfMonth != null) {
    let candidate = clampDayOfMonth(periodStart, rentDueDayOfMonth);
    if (candidate.isBefore(periodStart, 'day')) {
      candidate = clampDayOfMonth(periodStart.add(1, 'month'), rentDueDayOfMonth);
    }
    if (candidate.isAfter(periodEnd, 'day')) {
      return periodEnd;
    }
    return candidate;
  }

  return periodStart;
};

const buildDailyInstallments = (
  start: Dayjs,
  end: Dayjs,
  rate: number,
): RentalInstallmentDraft[] => {
  const days = countRentalDays(start.toISOString(), end.toISOString());
  if (days <= 0 || rate <= 0) {
    return [];
  }
  const installments: RentalInstallmentDraft[] = [];
  for (let i = 0; i < days; i++) {
    const periodStart = start.add(i, 'day');
    const due = resolveInstallmentDueDate(periodStart, periodStart, 'DAILY');
    installments.push({
      index: i + 1,
      dueDate: toDueDateString(due),
      periodStart: periodStart.toISOString(),
      periodEnd: periodStart.toISOString(),
      amount: rate,
      label: i18n.t('billing.dayInstallment', {
        index: i + 1,
        date: periodStart.format('D MMM YYYY'),
      }),
    });
  }
  return installments;
};

const buildWeeklyInstallments = (
  start: Dayjs,
  end: Dayjs,
  rate: number,
  rentDueWeekday?: number,
): RentalInstallmentDraft[] => {
  if (rate <= 0 || end.isBefore(start, 'day')) {
    return [];
  }
  const installments: RentalInstallmentDraft[] = [];
  let cursor = start;
  let weekNum = 1;
  while (!cursor.isAfter(end, 'day')) {
    const periodStart = cursor;
    const weekEnd = cursor.add(6, 'day');
    const periodEnd = weekEnd.isAfter(end) ? end : weekEnd;
    const due = resolveInstallmentDueDate(
      periodStart,
      periodEnd,
      'WEEKLY',
      rentDueWeekday,
    );
    installments.push({
      index: weekNum,
      dueDate: toDueDateString(due),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      amount: rate,
      label: i18n.t('billing.weekInstallment', {
        index: weekNum,
        start: periodStart.format('D MMM'),
        end: periodEnd.format('D MMM YYYY'),
      }),
    });
    cursor = periodEnd.add(1, 'day');
    weekNum += 1;
  }
  return installments;
};

const buildMonthlyInstallments = (
  start: Dayjs,
  end: Dayjs,
  rate: number,
  rentDueDayOfMonth?: number,
): RentalInstallmentDraft[] => {
  if (rate <= 0 || end.isBefore(start, 'day')) {
    return [];
  }
  const installments: RentalInstallmentDraft[] = [];
  let cursor = start;
  let monthNum = 1;
  while (!cursor.isAfter(end, 'day')) {
    const periodStart = cursor;
    const monthEnd = cursor.add(29, 'day');
    const periodEnd = monthEnd.isAfter(end) ? end : monthEnd;
    const due = resolveInstallmentDueDate(
      periodStart,
      periodEnd,
      'MONTHLY',
      undefined,
      rentDueDayOfMonth,
    );
    installments.push({
      index: monthNum,
      dueDate: toDueDateString(due),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      amount: rate,
      label: i18n.t('billing.monthInstallment', {
        index: monthNum,
        start: periodStart.format('D MMM'),
        end: periodEnd.format('D MMM YYYY'),
      }),
    });
    cursor = periodEnd.add(1, 'day');
    monthNum += 1;
  }
  return installments;
};

export const calculateRentalBillingPreview = (
  input: RentalBillingInput,
): RentalBillingPreview => {
  const start = startOfDay(input.startDate);
  const end = startOfDay(input.endDate);
  const rate = Math.max(0, input.rateAmount);
  const rentalDayCount = countRentalDays(start.toISOString(), end.toISOString());

  if (rentalDayCount === 0 || rate === 0) {
    return { installments: [], totalAmount: 0, rentalDayCount };
  }

  let installments: RentalInstallmentDraft[] = [];
  switch (input.frequency) {
    case 'DAILY':
      installments = buildDailyInstallments(start, end, rate);
      break;
    case 'WEEKLY':
      installments = buildWeeklyInstallments(start, end, rate, input.rentDueWeekday);
      break;
    case 'MONTHLY':
      installments = buildMonthlyInstallments(start, end, rate, input.rentDueDayOfMonth);
      break;
    default:
      installments = [];
  }

  const totalAmount = installments.reduce((sum, row) => sum + row.amount, 0);
  return { installments, totalAmount, rentalDayCount };
};

export const billingFrequencyLabel = (frequency: BillingFrequency): string => {
  switch (frequency) {
    case 'DAILY':
      return i18n.t('billing.perDay');
    case 'WEEKLY':
      return i18n.t('billing.perWeek');
    case 'MONTHLY':
      return i18n.t('billing.perMonth');
    default:
      return frequency;
  }
};

export const rateFieldLabel = (frequency: BillingFrequency): string => {
  switch (frequency) {
    case 'DAILY':
      return i18n.t('billing.dailyRate');
    case 'WEEKLY':
      return i18n.t('billing.weeklyRate');
    case 'MONTHLY':
      return i18n.t('billing.monthlyRate');
    default:
      return i18n.t('billing.rate');
  }
};

export const formatRentDueDaySummary = (
  frequency: BillingFrequency,
  rentDueWeekday?: number,
  rentDueDayOfMonth?: number,
): string => {
  switch (frequency) {
    case 'DAILY':
      return i18n.t('billing.dueEachRentalDay');
    case 'WEEKLY':
      if (rentDueWeekday != null) {
        return i18n.t('billing.dueEveryWeekday', {
          weekday: i18n.t(`billing.weekdays.${WEEKDAY_KEYS[rentDueWeekday]}`),
        });
      }
      return i18n.t('billing.pickWeekday');
    case 'MONTHLY':
      if (rentDueDayOfMonth != null) {
        return i18n.t('billing.dueOnDayOfMonth', { day: rentDueDayOfMonth });
      }
      return i18n.t('billing.pickDayOfMonth');
    default:
      return '';
  }
};
