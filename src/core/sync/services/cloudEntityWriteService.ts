import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { syncOutboxRepository } from '../repositories/syncOutboxRepository';
import { networkConnectivityService } from './networkConnectivityService';

type IdentifiableEntity = { id: string };

/**
 * After a local AsyncStorage write, pushes the entity to Firestore or queues it for later.
 */
export const cloudEntityWriteService = {
  async upsertEntity<T extends IdentifiableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !getCurrentFirebaseUser()) {
      return;
    }

    const online = await networkConnectivityService.isOnline();
    if (online) {
      await firestoreDocumentSyncService.upsertDocument(collectionName, entity);
      return;
    }

    await syncOutboxRepository.enqueue({
      collectionName,
      operation: 'upsert',
      payload: entity as unknown as Record<string, unknown>,
    });
    await useCloudSyncStore.getState().refreshPendingSync();
  },

  async deleteEntity(
    collectionName: FirestoreCollectionName,
    documentId: string,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !getCurrentFirebaseUser()) {
      return;
    }

    const online = await networkConnectivityService.isOnline();
    if (online) {
      await firestoreDocumentSyncService.deleteDocument(collectionName, documentId);
      return;
    }

    await syncOutboxRepository.enqueue({
      collectionName,
      operation: 'delete',
      payload: { id: documentId },
    });
    await useCloudSyncStore.getState().refreshPendingSync();
  },
};
