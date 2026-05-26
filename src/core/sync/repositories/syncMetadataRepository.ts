import { storageService } from '@core/storage/storageService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { todayISO } from '@core/helpers/date';
import type { SyncMetadata } from '../types/syncTypes';

/** Stores last successful cloud sync time for UI and debugging. */
export const syncMetadataRepository = {
  async get(): Promise<SyncMetadata> {
    return (
      (await storageService.getItem<SyncMetadata>(STORAGE_KEYS.SYNC_METADATA)) ?? {
        lastSyncedAt: null,
      }
    );
  },

  async setLastSyncedAt(iso: string = todayISO()): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.SYNC_METADATA, { lastSyncedAt: iso });
  },
};
