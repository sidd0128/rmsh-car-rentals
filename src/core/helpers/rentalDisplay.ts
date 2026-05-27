import dayjs from 'dayjs';
import i18n from '@core/i18n';
import { isOpenEndedRental } from '@core/constants/rental';
import { formatDateTimeAmPm } from '@core/helpers/date';

export const formatRentalEndDisplay = (endDate: string): string =>
  isOpenEndedRental(endDate) ? i18n.t('rentals.openEnded') : formatDateTimeAmPm(endDate);

export const formatRentalDurationWeeks = (startDate: string, endDate: string): string => {
  if (isOpenEndedRental(endDate)) {
    return i18n.t('history.durationOngoing');
  }
  const weeks = Math.max(1, Math.ceil(dayjs(endDate).diff(dayjs(startDate), 'week', true)));
  return i18n.t('history.durationWeeks', { count: weeks });
};

export const mergeDateAndTime = (datePart: Date, timePart: Date): Date =>
  dayjs(datePart)
    .hour(dayjs(timePart).hour())
    .minute(dayjs(timePart).minute())
    .second(0)
    .millisecond(0)
    .toDate();
