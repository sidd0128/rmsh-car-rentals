import { isOpenEndedRental } from '@core/constants/rental';
import { repositories } from '@core/database/repositoryRegistry';
import type { Rental } from '@core/types/domain';
import {
  calculateRentalBillingPreview,
  type RentalInstallmentDraft,
} from './rentalBillingService';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from './availabilityService';

export interface UpdateRentalRentDueDayInput {
  rentDueWeekday?: number;
  rentDueDayOfMonth?: number;
}

export type UpdateRentalRentDueDayResult =
  | { success: true; rental: Rental }
  | { success: false; error: string };

const validateRentDueDay = (
  rental: Rental,
  input: UpdateRentalRentDueDayInput,
): string | undefined => {
  if (rental.billingFrequency === 'WEEKLY') {
    if (
      input.rentDueWeekday == null ||
      input.rentDueWeekday < 0 ||
      input.rentDueWeekday > 6
    ) {
      return 'Select a valid rent weekday';
    }
  }

  if (rental.billingFrequency === 'MONTHLY') {
    if (
      input.rentDueDayOfMonth == null ||
      input.rentDueDayOfMonth < 1 ||
      input.rentDueDayOfMonth > 28
    ) {
      return 'Select a valid rent day of month';
    }
  }

  return undefined;
};

const updateUnpaidInstallments = async (
  rental: Rental,
  installments: RentalInstallmentDraft[],
): Promise<void> => {
  const payments = await repositories.payments.getPayments();
  const rentalPayments = payments.filter(
    payment => payment.rentalId === rental.id,
  );

  for (const installment of installments) {
    const payment = rentalPayments.find(
      row =>
        row.installmentIndex === installment.index && row.status !== 'DONE',
    );

    if (!payment) {
      continue;
    }

    await repositories.payments.updatePayment({
      ...payment,
      dueDate: installment.dueDate,
      periodStart: installment.periodStart,
      periodEnd: installment.periodEnd,
      label: installment.label,
      amount: installment.amount,
    });
  }
};

export const updateRentalRentDueDay = async (
  rentalId: string,
  input: UpdateRentalRentDueDayInput,
): Promise<UpdateRentalRentDueDayResult> => {
  const rental = await repositories.rentals.getRentalById(rentalId);
  if (!rental) {
    return { success: false, error: 'Rental not found' };
  }

  if (
    rental.billingFrequency !== 'WEEKLY' &&
    rental.billingFrequency !== 'MONTHLY'
  ) {
    return {
      success: false,
      error: 'This rental does not use a selectable rent due day',
    };
  }

  const validationError = validateRentDueDay(rental, input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const updated: Rental = {
    ...rental,
    rentDueWeekday:
      rental.billingFrequency === 'WEEKLY' ? input.rentDueWeekday : undefined,
    rentDueDayOfMonth:
      rental.billingFrequency === 'MONTHLY'
        ? input.rentDueDayOfMonth
        : undefined,
  };

  if (
    !isOpenEndedRental(rental.endDate) &&
    rental.rateAmount != null &&
    rental.rateAmount > 0
  ) {
    const preview = calculateRentalBillingPreview({
      startDate: rental.startDate,
      endDate: rental.endDate,
      frequency: rental.billingFrequency,
      rateAmount: rental.rateAmount,
      rentDueWeekday: updated.rentDueWeekday,
      rentDueDayOfMonth: updated.rentDueDayOfMonth,
    });

    updated.agreedPrice = preview.totalAmount;
    await updateUnpaidInstallments(updated, preview.installments);
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

  return {
    success: true,
    rental: updated,
  };
};
