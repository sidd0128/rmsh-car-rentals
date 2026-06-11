import dayjs from 'dayjs';
import { repositories } from '@core/database/repositoryRegistry';
import {
  isOpenEndedRental,
  OPEN_ENDED_RENTAL_END_ISO,
} from '@core/constants/rental';
import { hasBookingConflict } from './bookingConflictService';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from './availabilityService';
import type { Rental } from '@core/types/domain';

export type UpdateRentalEndDateResult =
  | { success: true; rental: Rental }
  | { success: false; error: string };

export const updateRentalEndDate = async (
  rentalId: string,
  newEndDate: string,
): Promise<UpdateRentalEndDateResult> => {
  const rentals = await repositories.rentals.getRentals();
  const rental = rentals.find(r => r.id === rentalId);
  if (!rental) {
    return { success: false, error: 'Rental not found' };
  }

  const end = dayjs(newEndDate);
  const start = dayjs(rental.startDate);
  if (end.isBefore(start)) {
    return { success: false, error: 'End must be after the rental start' };
  }

  const carRentals = rentals.filter(r => r.carId === rental.carId);
  if (
    hasBookingConflict(
      carRentals,
      { startDate: rental.startDate, endDate: newEndDate },
      rental.id,
    )
  ) {
    return {
      success: false,
      error: 'Booking dates conflict with another rental',
    };
  }

  const wasOpen = isOpenEndedRental(rental.endDate);
  const updated: Rental = {
    ...rental,
    endDate: newEndDate,
    updatedAt: new Date().toISOString(),
    status:
      rental.status === 'UPCOMING'
        ? rental.status
        : end.isAfter(dayjs())
        ? 'ACTIVE'
        : 'COMPLETED',
  };

  if (wasOpen && !isOpenEndedRental(newEndDate)) {
    updated.endDate = newEndDate;
  }

  await repositories.rentals.updateRental(updated);

  const car = await repositories.cars.getCarById(rental.carId);
  if (car) {
    const updatedRentals = await repositories.rentals.getRentalsByCarId(
      rental.carId,
    );
    await repositories.cars.updateCar({
      ...car,
      status: deriveCarStatus(car, updatedRentals),
      currentBooking: resolveCurrentBookingForCar(rental.carId, updatedRentals),
      futureBookings: resolveFutureBookingsForCar(rental.carId, updatedRentals),
    });
  }

  return { success: true, rental: updated };
};

export { OPEN_ENDED_RENTAL_END_ISO };
