import { repositories } from '@core/database/repositoryRegistry';
import { rentalStartsInFuture } from '@core/helpers/rentalStatus';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from './availabilityService';

export type CancelUpcomingRentalResult =
  | { success: true }
  | { success: false; error: string };

export const cancelUpcomingRental = async (
  rentalId: string,
): Promise<CancelUpcomingRentalResult> => {
  const rental = await repositories.rentals.getRentalById(rentalId);
  if (!rental) {
    return { success: false, error: 'Upcoming booking not found' };
  }

  if (!rentalStartsInFuture(rental)) {
    return {
      success: false,
      error: 'Only upcoming bookings can be cancelled immediately',
    };
  }

  const payments = await repositories.payments.getPayments();
  const rentalPayments = payments.filter(payment => payment.rentalId === rental.id);

  for (const payment of rentalPayments) {
    await repositories.payments.deletePayment(payment.id);
  }

  await repositories.rentals.deleteRental(rental.id);

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

  return { success: true };
};
