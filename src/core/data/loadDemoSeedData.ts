import { buildFullDemoSeed } from '@core/data/demoSeedData';
import {
  deriveCarStatus,
  resolveCurrentBookingForCar,
  resolveFutureBookingsForCar,
} from '@core/services/availabilityService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { storageService } from '@core/storage/storageService';
import { resetDomainStores } from '@core/storage/resetDomainStores';
import type { Car, Customer, PaymentRecord } from '@core/types/domain';

const enrichCustomers = (
  customers: Customer[],
  rentals: ReturnType<typeof buildFullDemoSeed>['rentals'],
  payments: PaymentRecord[],
): Customer[] =>
  customers.map(customer => ({
    ...customer,
    totalRentals: rentals.filter(r => r.customerId === customer.id).length,
    totalSpent: payments
      .filter(p => p.customerId === customer.id && p.status === 'DONE')
      .reduce((sum, p) => sum + p.amount, 0),
  }));

const enrichCars = (
  cars: Car[],
  rentals: ReturnType<typeof buildFullDemoSeed>['rentals'],
  payments: PaymentRecord[],
): Car[] =>
  cars.map(car => {
    const carRentals = rentals.filter(r => r.carId === car.id);
    const totalEarnings = payments
      .filter(p => p.carId === car.id && p.status === 'DONE')
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      ...car,
      totalEarnings,
      status: deriveCarStatus(car, carRentals),
      currentBooking: resolveCurrentBookingForCar(car.id, carRentals),
      futureBookings: resolveFutureBookingsForCar(car.id, carRentals),
    };
  });

/**
 * Replaces all local domain data with the full demo dataset (no Firebase writes).
 */
export const loadDemoSeedData = async (): Promise<void> => {
  const { cars, customers, rentals, fines, accidents, payments } = buildFullDemoSeed();

  const enrichedCustomers = enrichCustomers(customers, rentals, payments);
  const enrichedCars = enrichCars(cars, rentals, payments);

  await Promise.all([
    storageService.setItem(STORAGE_KEYS.CARS, enrichedCars),
    storageService.setItem(STORAGE_KEYS.CUSTOMERS, enrichedCustomers),
    storageService.setItem(STORAGE_KEYS.RENTALS, rentals),
    storageService.setItem(STORAGE_KEYS.FINES, fines),
    storageService.setItem(STORAGE_KEYS.ACCIDENTS, accidents),
    storageService.setItem(STORAGE_KEYS.PAYMENTS, payments),
  ]);

  resetDomainStores();
};
