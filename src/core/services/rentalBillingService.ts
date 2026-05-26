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

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RENT_DUE_WEEKDAY_OPTIONS = WEEKDAY_NAMES.map((name, value) => ({
  value,
  label: name,
  shortLabel: name.slice(0, 3),
}));

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
      label: `Day ${i + 1} (${periodStart.format('D MMM YYYY')})`,
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
      label: `Week ${weekNum} (${periodStart.format('D MMM')} – ${periodEnd.format('D MMM YYYY')})`,
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
      label: `Month ${monthNum} (${periodStart.format('D MMM')} – ${periodEnd.format('D MMM YYYY')})`,
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
      return 'Per day';
    case 'WEEKLY':
      return 'Per week';
    case 'MONTHLY':
      return 'Per month';
    default:
      return frequency;
  }
};

export const rateFieldLabel = (frequency: BillingFrequency): string => {
  switch (frequency) {
    case 'DAILY':
      return 'Daily rate (AUD)';
    case 'WEEKLY':
      return 'Weekly rate (AUD)';
    case 'MONTHLY':
      return 'Monthly rate (AUD)';
    default:
      return 'Rate (AUD)';
  }
};

export const formatRentDueDaySummary = (
  frequency: BillingFrequency,
  rentDueWeekday?: number,
  rentDueDayOfMonth?: number,
): string => {
  switch (frequency) {
    case 'DAILY':
      return 'Due each rental day';
    case 'WEEKLY':
      if (rentDueWeekday != null) {
        return `Due every ${WEEKDAY_NAMES[rentDueWeekday]}`;
      }
      return 'Pick a weekday for rent due';
    case 'MONTHLY':
      if (rentDueDayOfMonth != null) {
        return `Due on day ${rentDueDayOfMonth} of each period`;
      }
      return 'Pick a day of month for rent due';
    default:
      return '';
  }
};
