export const STORAGE_KEYS = {
  CARS: '@rmsh/cars',
  CUSTOMERS: '@rmsh/customers',
  RENTALS: '@rmsh/rentals',
  FINES: '@rmsh/fines',
  ACCIDENTS: '@rmsh/accidents',
  PAYMENTS: '@rmsh/payments',
  SEED_VERSION: '@rmsh/seed_version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
