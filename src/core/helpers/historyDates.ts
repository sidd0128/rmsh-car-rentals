import dayjs from 'dayjs';
import {
  HISTORY_DATE_FUTURE_YEARS,
  HISTORY_RETENTION_YEARS,
  UNLIMITED_HISTORY_PICKER_LOOKBACK_YEARS,
} from '@core/constants/history';

/** Earliest date users can pick for historical fines, accidents, rentals, etc. */
export const getEarliestSelectableHistoryDate = (): Date => {
  if (HISTORY_RETENTION_YEARS == null) {
    return dayjs().subtract(UNLIMITED_HISTORY_PICKER_LOOKBACK_YEARS, 'year').startOf('day').toDate();
  }
  return dayjs().subtract(HISTORY_RETENTION_YEARS, 'year').startOf('day').toDate();
};

/** Latest date users can pick (supports future bookings). */
export const getLatestSelectableHistoryDate = (): Date =>
  dayjs().add(HISTORY_DATE_FUTURE_YEARS, 'year').endOf('day').toDate();
