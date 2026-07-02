import { buildFullDemoSeed } from '@core/data/demoSeedData';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { storageService } from '@core/storage/storageService';
import { resetDomainStores } from '@core/storage/resetDomainStores';

/**
 * Replaces all local domain data with the full demo dataset (no Firebase writes).
 * Car status and bookings are derived on the next store hydrate from rentals.
 */
export const loadDemoSeedData = async (): Promise<void> => {
  const { cars, customers, rentals, fines, accidents, payments } =
    buildFullDemoSeed();

  await Promise.all([
    storageService.setItem(STORAGE_KEYS.CARS, cars),
    storageService.setItem(STORAGE_KEYS.CUSTOMERS, customers),
    storageService.setItem(STORAGE_KEYS.RENTALS, rentals),
    storageService.setItem(STORAGE_KEYS.FINES, fines),
    storageService.setItem(STORAGE_KEYS.ACCIDENTS, accidents),
    storageService.setItem(STORAGE_KEYS.PAYMENTS, payments),
    storageService.setItem(STORAGE_KEYS.BOOKING_REQUESTS, []),
  ]);

  resetDomainStores();
};
