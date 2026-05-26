import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { storageService } from '@core/storage/storageService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import type { SyncOutboxEntry, SyncOperationType } from '../types/syncTypes';

/**
 * Persists mutations that could not reach Firestore while offline.
 * Processed by offlineFirstSyncOrchestratorService when connectivity returns.
 */
export const syncOutboxRepository = {
  async getAll(): Promise<SyncOutboxEntry[]> {
    return (await storageService.getItem<SyncOutboxEntry[]>(STORAGE_KEYS.SYNC_OUTBOX)) ?? [];
  },

  async enqueue(params: {
    collectionName: FirestoreCollectionName;
    operation: SyncOperationType;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const entries = await this.getAll();
    const entry: SyncOutboxEntry = {
      id: createId(),
      collectionName: params.collectionName,
      operation: params.operation,
      payload: params.payload,
      createdAt: todayISO(),
    };
    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, [...entries, entry]);
  },

  async replaceAll(entries: SyncOutboxEntry[]): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, entries);
  },

  async clear(): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, []);
  },
};
