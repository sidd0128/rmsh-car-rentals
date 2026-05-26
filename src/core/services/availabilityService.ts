/**
 * Derives display status for a car from its non-completed rentals (pure function).
 */
import dayjs from 'dayjs';
import type { Car, Rental } from '../types/domain';

const isWithinRentalPeriod = (rental: Rental, now: dayjs.Dayjs): boolean => {
  const start = dayjs(rental.startDate).startOf('day');
  const end = dayjs(rental.endDate).startOf('day');
  return !now.isBefore(start, 'day') && !now.isAfter(end, 'day');
};

/** Rental whose contract period includes today (any non-completed status). */
export const resolveCurrentBookingForCar = (
  carId: string,
  rentals: Rental[],
): Rental | undefined => {
  const now = dayjs().startOf('day');
  return rentals
    .filter(
      r =>
        r.carId === carId &&
        r.status !== 'COMPLETED' &&
        isWithinRentalPeriod(r, now),
    )
    .sort((a, b) => dayjs(b.endDate).valueOf() - dayjs(a.endDate).valueOf())[0];
};

/** Next rental that starts after today; only when the car is not on rent today. */
export const resolveNextUpcomingBookingForCar = (
  carId: string,
  rentals: Rental[],
): Rental | undefined => {
  const now = dayjs().startOf('day');
  if (resolveCurrentBookingForCar(carId, rentals)) {
    return undefined;
  }

  return rentals
    .filter(
      r =>
        r.carId === carId &&
        r.status !== 'COMPLETED' &&
        now.isBefore(dayjs(r.startDate).startOf('day'), 'day'),
    )
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())[0];
};

/** True when the car has a future booking and is not currently on rent. */
export const carHasUpcomingBookingOnly = (car: Car, rentals: Rental[]): boolean =>
  resolveNextUpcomingBookingForCar(car.id, rentals) !== undefined;

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
  const now = dayjs().startOf('day');
  return rentals
    .filter(
      r =>
        r.carId === carId &&
        r.status !== 'COMPLETED' &&
        now.isBefore(dayjs(r.startDate).startOf('day'), 'day'),
    )
    .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());
};
