import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { firestoreDocumentSyncService } from '@core/firebase/services/firestoreDocumentSyncService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { logError } from '@error/errorLogger';
import { syncOutboxRepository } from '../repositories/syncOutboxRepository';
import type { SyncOutboxEntry } from '../types/syncTypes';
import { cloudMediaSyncService } from './cloudMediaSyncService';
import { networkConnectivityService } from './networkConnectivityService';

type IdentifiableEntity = { id: string };

const entryIsStillPending = async (entryId: string): Promise<boolean> => {
  const entries = await syncOutboxRepository.getAll();
  return entries.some(entry => entry.id === entryId);
};

const flushQueuedEntityMutation = async (
  entry: SyncOutboxEntry,
): Promise<void> => {
  const online = await networkConnectivityService.isOnline();
  if (!online) {
    return;
  }

  if (!(await entryIsStillPending(entry.id))) {
    return;
  }

  if (entry.operation === 'delete') {
    await firestoreDocumentSyncService.deleteDocument(
      entry.collectionName,
      String(entry.payload.id),
    );
  } else {
    const cloudReadyPayload = await cloudMediaSyncService.prepareEntityForCloud(
      entry.collectionName,
      entry.payload as IdentifiableEntity,
      { showUploadErrors: false },
    );
    if (!(await entryIsStillPending(entry.id))) {
      return;
    }

    await firestoreDocumentSyncService.upsertDocument(
      entry.collectionName,
      cloudMediaSyncService.stripLocalMediaUrisForCloud(
        entry.collectionName,
        cloudReadyPayload,
      ),
    );
  }

  await syncOutboxRepository.remove(entry.id);
  await useCloudSyncStore.getState().refreshPendingSync();
};

const scheduleQueuedEntityMutationFlush = (entry: SyncOutboxEntry): void => {
  flushQueuedEntityMutation(entry).catch(error => {
    logError(error, {
      source: 'cloudEntityWriteService.flushQueuedEntityMutation',
    });
  });
};

/**
 * After a local AsyncStorage write, queues the exact entity mutation for cloud sync.
 * User-facing writes should not wait for network, media upload, or Firestore latency.
 */
export const cloudEntityWriteService = {
  async upsertEntity<T extends IdentifiableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
    _previousEntity?: T,
  ): Promise<T> {
    if (!isFirebaseConfigured() || !getCurrentFirebaseUser()) {
      return entity;
    }

    const entry = await syncOutboxRepository.enqueue({
      collectionName,
      operation: 'upsert',
      payload: entity as unknown as Record<string, unknown>,
    });
    await useCloudSyncStore.getState().refreshPendingSync();
    scheduleQueuedEntityMutationFlush(entry);
    return entity;
  },

  async deleteEntity(
    collectionName: FirestoreCollectionName,
    entityId: string,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !getCurrentFirebaseUser()) {
      return;
    }

    const entry = await syncOutboxRepository.enqueue({
      collectionName,
      operation: 'delete',
      payload: { id: entityId },
    });
    await useCloudSyncStore.getState().refreshPendingSync();
    scheduleQueuedEntityMutationFlush(entry);
  },
};
