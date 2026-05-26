export const STORAGE_KEYS = {
  CARS: '@rmsh/cars',
  CUSTOMERS: '@rmsh/customers',
  RENTALS: '@rmsh/rentals',
  FINES: '@rmsh/fines',
  ACCIDENTS: '@rmsh/accidents',
  PAYMENTS: '@rmsh/payments',
  /** Pending Firestore writes while offline */
  SYNC_OUTBOX: '@rmsh/sync_outbox',
  /** Last successful cloud sync timestamp */
  SYNC_METADATA: '@rmsh/sync_metadata',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
