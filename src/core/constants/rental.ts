import dayjs from 'dayjs';

/** Stored end date for rentals with no fixed return date yet. */
export const OPEN_ENDED_RENTAL_END_ISO = '2099-12-31T23:59:59.999Z';

export const isOpenEndedRental = (endDate: string): boolean =>
  dayjs(endDate).year() >= 2099;
