import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { syncOutboxRepository } from '../repositories/syncOutboxRepository';
import { cloudMediaSyncService } from './cloudMediaSyncService';
import { networkConnectivityService } from './networkConnectivityService';

type IdentifiableEntity = { id: string };

/**
 * After a local AsyncStorage write, pushes the entity to Firestore or queues it for later.
 */
export const cloudEntityWriteService = {
  async upsertEntity<T extends IdentifiableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
    previousEntity?: T,
  ): Promise<T> {
    if (!isFirebaseConfigured() || !getCurrentFirebaseUser()) {
      return entity;
    }

    const online = await networkConnectivityService.isOnline();
    if (online) {
      const cloudReadyEntity = await cloudMediaSyncService.prepareEntityForCloud(
        collectionName,
        entity,
      );
      await firestoreDocumentSyncService.upsertDocument(
        collectionName,
        cloudMediaSyncService.stripLocalMediaUrisForCloud(collectionName, cloudReadyEntity),
      );
      await cloudMediaSyncService.deleteRemovedRemoteMedia(previousEntity, cloudReadyEntity);
      return cloudReadyEntity;
    }

    await syncOutboxRepository.enqueue({
      collectionName,
      operation: 'upsert',
      payload: entity as unknown as Record<string, unknown>,
    });
    await useCloudSyncStore.getState().refreshPendingSync();
    return entity;
  },
};
