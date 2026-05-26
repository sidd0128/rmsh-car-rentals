import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirebaseAppOrNull } from '@core/firebase/services/firebaseAppInitializationService';
import { asyncStorageAccidentRepository } from '@features/accidents/repository/asyncStorageAccidentRepository';
import { asyncStorageCarRepository } from '@features/cars/repository/asyncStorageCarRepository';
import { asyncStorageCustomerRepository } from '@features/customers/repository/asyncStorageCustomerRepository';
import { asyncStorageFineRepository } from '@features/fines/repository/asyncStorageFineRepository';
import { asyncStoragePaymentRepository } from '@features/payments/repository/asyncStoragePaymentRepository';
import { asyncStorageRentalRepository } from '@features/rentals/repository/asyncStorageRentalRepository';
import type {
  AccidentRecord,
  Car,
  Customer,
  Fine,
  PaymentRecord,
  Rental,
} from '@core/types/domain';
import { mergeEntityListsByTimestamp } from './entityTimestampMergeService';
import { networkConnectivityService } from './networkConnectivityService';
import { syncMetadataRepository } from '../repositories/syncMetadataRepository';
import { syncOutboxRepository } from '../repositories/syncOutboxRepository';

export interface CloudSyncResult {
  success: boolean;
  skipped: boolean;
  message: string;
}

/**
 * Coordinates bidirectional sync: Firestore ↔ AsyncStorage.
 * Zustand stores re-hydrate from repositories after sync completes.
 */
export const offlineFirstSyncOrchestratorService = {
  async syncWithCloud(): Promise<CloudSyncResult> {
    if (!isFirebaseConfigured()) {
      return {
        success: true,
        skipped: true,
        message: 'Firebase not configured — running offline with local storage only.',
      };
    }

    if (!getFirebaseAppOrNull()) {
      return {
        success: true,
        skipped: true,
        message: 'Firebase not initialized.',
      };
    }

    if (!getCurrentFirebaseUser()) {
      return {
        success: true,
        skipped: true,
        message: 'Sign in to sync with the cloud.',
      };
    }

    const online = await networkConnectivityService.isOnline();
    if (!online) {
      return {
        success: true,
        skipped: true,
        message: 'Device offline — using local data. Changes will sync when online.',
      };
    }

    try {
      await this.processOutbox();
      await this.pullRemoteIntoLocal();
      await this.pushLocalOnlyDocuments();
      await syncMetadataRepository.setLastSyncedAt();
      return {
        success: true,
        skipped: false,
        message: 'Cloud sync completed.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cloud sync failed';
      return { success: false, skipped: false, message };
    }
  },

  /** Applies queued writes created while offline. */
  async processOutbox(): Promise<void> {
    const entries = await syncOutboxRepository.getAll();
    if (entries.length === 0) {
      return;
    }

    const remaining = [];

    for (const entry of entries) {
      try {
        if (entry.operation === 'delete') {
          const id = String(entry.payload.id);
          await firestoreDocumentSyncService.deleteDocument(entry.collectionName, id);
        } else {
          await firestoreDocumentSyncService.upsertDocument(
            entry.collectionName,
            entry.payload as { id: string },
          );
        }
      } catch {
        remaining.push(entry);
      }
    }

    await syncOutboxRepository.replaceAll(remaining);
  },

  /** Downloads Firestore data and merges into AsyncStorage (newer timestamp wins). */
  async pullRemoteIntoLocal(): Promise<void> {
    const [remoteCars, remoteCustomers, remoteRentals, remoteFines, remoteAccidents, remotePayments] =
      await Promise.all([
        firestoreDocumentSyncService.fetchAllDocuments<Car>(FIRESTORE_COLLECTION_NAMES.CARS),
        firestoreDocumentSyncService.fetchAllDocuments<Customer>(
          FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
        ),
        firestoreDocumentSyncService.fetchAllDocuments<Rental>(
          FIRESTORE_COLLECTION_NAMES.RENTALS,
        ),
        firestoreDocumentSyncService.fetchAllDocuments<Fine>(FIRESTORE_COLLECTION_NAMES.FINES),
        firestoreDocumentSyncService.fetchAllDocuments<AccidentRecord>(
          FIRESTORE_COLLECTION_NAMES.ACCIDENTS,
        ),
        firestoreDocumentSyncService.fetchAllDocuments<PaymentRecord>(
          FIRESTORE_COLLECTION_NAMES.PAYMENTS,
        ),
      ]);

    const [localCars, localCustomers, localRentals, localFines, localAccidents, localPayments] =
      await Promise.all([
        asyncStorageCarRepository.getCars(),
        asyncStorageCustomerRepository.getCustomers(),
        asyncStorageRentalRepository.getRentals(),
        asyncStorageFineRepository.getFines(),
        asyncStorageAccidentRepository.getAccidents(),
        asyncStoragePaymentRepository.getPayments(),
      ]);

    await Promise.all([
      asyncStorageCarRepository.replaceAll(
        mergeEntityListsByTimestamp(localCars, remoteCars),
      ),
      asyncStorageCustomerRepository.replaceAll(
        mergeEntityListsByTimestamp(localCustomers, remoteCustomers),
      ),
      asyncStorageRentalRepository.replaceAll(
        mergeEntityListsByTimestamp(localRentals, remoteRentals),
      ),
      asyncStorageFineRepository.replaceAll(
        mergeEntityListsByTimestamp(localFines, remoteFines),
      ),
      asyncStorageAccidentRepository.replaceAll(
        mergeEntityListsByTimestamp(localAccidents, remoteAccidents),
      ),
      asyncStoragePaymentRepository.replaceAll(
        mergeEntityListsByTimestamp(localPayments, remotePayments),
      ),
    ]);
  },

  /** Uploads local documents that may not exist remotely yet (after merge). */
  async pushLocalOnlyDocuments(): Promise<void> {
    const [cars, customers, rentals, fines, accidents, payments] = await Promise.all([
      asyncStorageCarRepository.getCars(),
      asyncStorageCustomerRepository.getCustomers(),
      asyncStorageRentalRepository.getRentals(),
      asyncStorageFineRepository.getFines(),
      asyncStorageAccidentRepository.getAccidents(),
      asyncStoragePaymentRepository.getPayments(),
    ]);

    await Promise.all([
      ...cars.map(car =>
        firestoreDocumentSyncService.upsertDocument(FIRESTORE_COLLECTION_NAMES.CARS, car),
      ),
      ...customers.map(customer =>
        firestoreDocumentSyncService.upsertDocument(
          FIRESTORE_COLLECTION_NAMES.CUSTOMERS,
          customer,
        ),
      ),
      ...rentals.map(rental =>
        firestoreDocumentSyncService.upsertDocument(FIRESTORE_COLLECTION_NAMES.RENTALS, rental),
      ),
      ...fines.map(fine =>
        firestoreDocumentSyncService.upsertDocument(FIRESTORE_COLLECTION_NAMES.FINES, fine),
      ),
      ...accidents.map(accident =>
        firestoreDocumentSyncService.upsertDocument(
          FIRESTORE_COLLECTION_NAMES.ACCIDENTS,
          accident,
        ),
      ),
      ...payments.map(payment =>
        firestoreDocumentSyncService.upsertDocument(
          FIRESTORE_COLLECTION_NAMES.PAYMENTS,
          payment,
        ),
      ),
    ]);
  },
};
