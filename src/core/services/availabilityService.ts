/**
 * Derives display status for a car from its non-completed rentals (pure function).
 */
import i18n from '@core/i18n';
import dayjs from 'dayjs';
import {
  rentalIsCurrent,
  rentalStartsInFuture,
} from '@core/helpers/rentalStatus';
import type { Car, Rental } from '../types/domain';

/** Rental whose contract period includes today (any non-completed status). */
export const resolveCurrentBookingForCar = (
  carId: string,
  rentals: Rental[],
): Rental | undefined => {
  const now = dayjs();
  return rentals
    .filter(r => r.carId === carId && rentalIsCurrent(r, now))
    .sort((a, b) => dayjs(b.endDate).valueOf() - dayjs(a.endDate).valueOf())[0];
};

/** Next rental that starts after today; only when the car is not on rent today. */
export const resolveNextUpcomingBookingForCar = (
  carId: string,
  rentals: Rental[],
): Rental | undefined => {
  const now = dayjs();
  if (resolveCurrentBookingForCar(carId, rentals)) {
    return undefined;
  }

  return rentals
    .filter(r => r.carId === carId && rentalStartsInFuture(r, now))
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())[0];
};

/** True when the car has a future booking and is not currently on rent. */
export const carHasUpcomingBookingOnly = (car: Car, rentals: Rental[]): boolean =>
  resolveNextUpcomingBookingForCar(car.id, rentals) !== undefined;

/** Days until contract end (0 = ends today). */
export const daysUntilRentalEnd = (rental: Rental): number =>
  dayjs(rental.endDate).startOf('day').diff(dayjs().startOf('day'), 'day');

/** Active rental ending within this many days (includes overdue still marked active). */
export const RETURNS_SOON_WITHIN_DAYS = 3;

/** User-facing copy for dashboard and filtered car list. */
export const returnsSoonFilterDescription = (): string =>
  i18n.t('dashboard.returnsSoonDescription', { days: RETURNS_SOON_WITHIN_DAYS });

export const rentalIsReturningSoon = (
  rental: Rental,
  withinDays = RETURNS_SOON_WITHIN_DAYS,
): boolean =>
  rentalIsCurrent(rental) && daysUntilRentalEnd(rental) <= withinDays;

/** Car currently on rent with the active contract ending soon. */
export const carIsReturningSoon = (car: Car, rentals: Rental[]): boolean => {
  const current = resolveCurrentBookingForCar(car.id, rentals);
  return current ? rentalIsReturningSoon(current) : false;
};

export const deriveCarStatus = (car: Car, rentals: Rental[]): Car['status'] => {
  if (resolveCurrentBookingForCar(car.id, rentals)) {
    return 'ON_RENT';
  }
  if (resolveNextUpcomingBookingForCar(car.id, rentals)) {
    return 'UPCOMING_BOOKING';
  }
  return 'AVAILABLE';
};

/** Future rentals for display (excludes contracts already in progress today). */
export const resolveFutureBookingsForCar = (carId: string, rentals: Rental[]): Rental[] => {
  const now = dayjs();
  return rentals
    .filter(r => r.carId === carId && rentalStartsInFuture(r, now))
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());
};
