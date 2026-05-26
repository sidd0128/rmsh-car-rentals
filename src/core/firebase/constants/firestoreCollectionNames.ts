/**
 * Firestore collection names — one collection per domain entity.
 * Keep in sync with repository entities and sync orchestrator.
 */
export const FIRESTORE_COLLECTION_NAMES = {
  CARS: 'cars',
  CUSTOMERS: 'customers',
  RENTALS: 'rentals',
  FINES: 'fines',
  ACCIDENTS: 'accidents',
  PAYMENTS: 'payments',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTION_NAMES)[keyof typeof FIRESTORE_COLLECTION_NAMES];
