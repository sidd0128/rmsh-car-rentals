import dayjs from 'dayjs';
import type { Car, Rental } from '../types/domain';
import { hasBookingConflict } from './bookingConflictService';

export const deriveCarStatus = (car: Car, rentals: Rental[]): Car['status'] => {
  const now = dayjs();
  const carRentals = rentals.filter(r => r.carId === car.id && r.status !== 'COMPLETED');

  const active = carRentals.find(
    r =>
      r.status === 'ACTIVE' &&
      now.isAfter(dayjs(r.startDate)) &&
      now.isBefore(dayjs(r.endDate).add(1, 'day')),
  );
  if (active) {
    return 'ON_RENT';
  }

  const upcoming = carRentals.find(
    r => r.status === 'UPCOMING' || now.isBefore(dayjs(r.startDate)),
  );
  if (upcoming) {
    return 'UPCOMING_BOOKING';
  }

  return 'AVAILABLE';
};

export const getNextAvailabilityDate = (rentals: Rental[], carId: string): string | null => {
  const carRentals = rentals
    .filter(r => r.carId === carId && r.status !== 'COMPLETED')
    .sort((a, b) => dayjs(a.endDate).valueOf() - dayjs(b.endDate).valueOf());

  if (!carRentals.length) {
    return null;
  }
  return carRentals[carRentals.length - 1].endDate;
};

export const isCarAvailableForRange = (
  rentals: Rental[],
  carId: string,
  range: { startDate: string; endDate: string },
  excludeRentalId?: string,
): boolean => {
  const carRentals = rentals.filter(r => r.carId === carId);
  return !hasBookingConflict(carRentals, range, excludeRentalId);
};

export const availabilityService = {
  deriveCarStatus,
  getNextAvailabilityDate,
  isCarAvailableForRange,
};
