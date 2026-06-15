import dayjs from 'dayjs';
import { OPEN_ENDED_RENTAL_END_ISO } from '@core/constants/rental';
import { repositories } from '@core/database/repositoryRegistry';
import { formatDateTimeAmPm } from '@core/helpers/date';
import { deriveRentalPaymentStatus } from '@core/helpers/rentalPayments';
import type { AssignRentalInput } from '@features/rentals/types/assignRental';
import type { Rental } from '@core/types/domain';
import { findBookingConflict } from './bookingConflictService';
import { calculateRentalBillingPreview } from './rentalBillingService';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from './availabilityService';

export type ScheduledRentalResult =
  | { success: true; rental: Rental }
  | { success: false; error: string };

const buildBookingConflictError = async (conflict: Rental): Promise<string> => {
  const customer = await repositories.customers.getCustomerById(
    conflict.customerId,
  );
  const customerName = customer?.name ?? 'another customer';

  return `This car is already booked for ${customerName} from ${formatDateTimeAmPm(
    conflict.startDate,
  )} to ${formatDateTimeAmPm(
    conflict.endDate,
  )}. Please choose a different car or date range.`;
};

/**
 * Creates a rental contract and installment payments from assignment-style input.
 */
export const createScheduledRental = async (
  input: AssignRentalInput,
  options?: { excludeConflictRentalId?: string },
): Promise<ScheduledRentalResult> => {
  const start = dayjs(input.startDate);
  const endIso = input.openEnded ? OPEN_ENDED_RENTAL_END_ISO : input.endDate;
  const end = dayjs(endIso);
  if (!input.openEnded && end.isBefore(start)) {
    return { success: false, error: 'End date must be on or after start date' };
  }

  const preview = input.openEnded
    ? { installments: [], totalAmount: 0, rentalDayCount: 0 }
    : calculateRentalBillingPreview({
        startDate: input.startDate,
        endDate: input.endDate,
        frequency: input.billingFrequency,
        rateAmount: input.rateAmount,
        rentDueWeekday: input.rentDueWeekday,
        rentDueDayOfMonth: input.rentDueDayOfMonth,
      });

  if (!input.openEnded && preview.installments.length === 0) {
    return {
      success: false,
      error: 'Enter a valid rate and date range to generate a payment schedule',
    };
  }

  const rentals = await repositories.rentals.getRentals();
  const carRentals = rentals.filter(r => r.carId === input.carId);
  const bookingConflict = findBookingConflict(
    carRentals,
    { startDate: input.startDate, endDate: endIso },
    options?.excludeConflictRentalId,
  );

  if (bookingConflict) {
    return {
      success: false,
      error: await buildBookingConflictError(bookingConflict),
    };
  }

  const now = dayjs();
  const status = now.isBefore(start, 'day') ? 'UPCOMING' : 'ACTIVE';

  const rental = await repositories.rentals.addRental({
    carId: input.carId,
    customerId: input.customerId,
    startDate: input.startDate,
    endDate: endIso,
    agreedPrice: input.openEnded ? 0 : preview.totalAmount,
    paymentStatus: 'PENDING',
    status,
    billingFrequency: input.billingFrequency,
    rateAmount: input.rateAmount,
    collectFirstPaymentOnAssignment: input.collectFirstPaymentOnAssignment,
    rentDueWeekday: input.rentDueWeekday,
    rentDueDayOfMonth: input.rentDueDayOfMonth,
    notes: input.notes,
  });

  const createdPayments = [];
  if (!input.openEnded) {
    for (let i = 0; i < preview.installments.length; i++) {
      const installment = preview.installments[i];
      const collectNow = i === 0 && input.collectFirstPaymentOnAssignment;
      const payment = await repositories.payments.addPayment({
        rentalId: rental.id,
        customerId: input.customerId,
        carId: input.carId,
        amount: installment.amount,
        status: collectNow ? 'DONE' : 'PENDING',
        dueDate: installment.dueDate,
        installmentIndex: installment.index,
        label: installment.label,
        periodStart: installment.periodStart,
        periodEnd: installment.periodEnd,
        paidAt: collectNow ? new Date().toISOString() : undefined,
      });
      createdPayments.push(payment);
    }
  }

  const paymentStatus = deriveRentalPaymentStatus(createdPayments);
  let finalRental = rental;
  if (paymentStatus !== rental.paymentStatus) {
    finalRental = { ...rental, paymentStatus };
    await repositories.rentals.updateRental(finalRental);
  }

  const car = await repositories.cars.getCarById(input.carId);
  if (car) {
    const updatedRentals = await repositories.rentals.getRentalsByCarId(
      input.carId,
    );
    await repositories.cars.updateCar({
      ...car,
      status: deriveCarStatus(car, updatedRentals),
      currentBooking: resolveCurrentBookingForCar(input.carId, updatedRentals),
      futureBookings: resolveFutureBookingsForCar(input.carId, updatedRentals),
    });
  }

  return { success: true, rental: finalRental };
};
