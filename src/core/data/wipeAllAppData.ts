import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { storageService } from '@core/storage/storageService';
import { resetDomainStores } from '@core/storage/resetDomainStores';
import type {
  AccidentRecord,
  Car,
  Customer,
  Fine,
  PaymentRecord,
  Rental,
} from '@core/types/domain';
import type { SyncOutboxEntry } from '@core/sync/types/syncTypes';

const ALL_COLLECTIONS: FirestoreCollectionName[] = [
  FIRESTORE_COLLECTION_NAMES.CARS,
  FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
  FIRESTORE_COLLECTION_NAMES.RENTALS,
  FIRESTORE_COLLECTION_NAMES.FINES,
  FIRESTORE_COLLECTION_NAMES.ACCIDENTS,
  FIRESTORE_COLLECTION_NAMES.PAYMENTS,
];

const ZUSTAND_PERSIST_KEYS = ['@rmsh/car-filter-prefs'] as const;

export interface WipeAllAppDataResult {
  localCleared: boolean;
  cloudDeletedByCollection: Partial<Record<FirestoreCollectionName, number>>;
  cloudSkipped: boolean;
}

const deleteAllInCollection = async (
  collectionName: FirestoreCollectionName,
): Promise<number> => {
  const documents = await firestoreDocumentSyncService.fetchAllDocuments<{ id: string }>(
    collectionName,
  );
  await Promise.all(
    documents.map(document =>
      firestoreDocumentSyncService.deleteDocument(collectionName, document.id),
    ),
  );
  return documents.length;
};

const clearLocalDomainStorage = async (): Promise<void> => {
  await Promise.all([
    storageService.setItem<Car[]>(STORAGE_KEYS.CARS, []),
    storageService.setItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, []),
    storageService.setItem<Rental[]>(STORAGE_KEYS.RENTALS, []),
    storageService.setItem<Fine[]>(STORAGE_KEYS.FINES, []),
    storageService.setItem<AccidentRecord[]>(STORAGE_KEYS.ACCIDENTS, []),
    storageService.setItem<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []),
    storageService.setItem(STORAGE_KEYS.SYNC_METADATA, { lastSyncedAt: null }),
    storageService.setItem<SyncOutboxEntry[]>(STORAGE_KEYS.SYNC_OUTBOX, []),
    ...ZUSTAND_PERSIST_KEYS.map(key => storageService.removeItem(key)),
  ]);
};

/**
 * Wipes all fleet data on device and in Firestore (when signed in).
 * Keeps you logged in; does not clear Firebase Auth session keys.
 */
export const wipeAllAppData = async (): Promise<WipeAllAppDataResult> => {
  const cloudDeletedByCollection: Partial<Record<FirestoreCollectionName, number>> = {};
  let cloudSkipped = true;

  if (isFirebaseConfigured() && getCurrentFirebaseUser()) {
    cloudSkipped = false;
    for (const collectionName of ALL_COLLECTIONS) {
      cloudDeletedByCollection[collectionName] = await deleteAllInCollection(collectionName);
    }
  }

  await clearLocalDomainStorage();
  resetDomainStores();

  return {
    localCleared: true,
    cloudDeletedByCollection,
    cloudSkipped,
  };
};
