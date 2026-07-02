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
    return (
      (await storageService.getItem<SyncOutboxEntry[]>(
        STORAGE_KEYS.SYNC_OUTBOX,
      )) ?? []
    );
  },

  async enqueue(params: {
    collectionName: FirestoreCollectionName;
    operation: SyncOperationType;
    payload: Record<string, unknown>;
  }): Promise<SyncOutboxEntry> {
    const entries = await this.getAll();
    const entityId = String(params.payload.id ?? '');
    const entry: SyncOutboxEntry = {
      id: createId(),
      collectionName: params.collectionName,
      operation: params.operation,
      payload: params.payload,
      createdAt: todayISO(),
    };

    if (!entityId) {
      await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, [
        ...entries,
        entry,
      ]);
      return entry;
    }

    const unrelatedEntries = entries.filter(existing => {
      const existingEntityId = String(existing.payload.id ?? '');
      return (
        existing.collectionName !== params.collectionName ||
        existingEntityId !== entityId
      );
    });

    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, [
      ...unrelatedEntries,
      entry,
    ]);
    return entry;
  },

  async remove(entryId: string): Promise<void> {
    const entries = await this.getAll();
    await storageService.setItem(
      STORAGE_KEYS.SYNC_OUTBOX,
      entries.filter(entry => entry.id !== entryId),
    );
  },

  async replaceAll(entries: SyncOutboxEntry[]): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, entries);
  },

  async clear(): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.SYNC_OUTBOX, []);
  },
};
