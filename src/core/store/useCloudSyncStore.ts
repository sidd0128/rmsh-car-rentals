import { create } from 'zustand';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { offlineFirstSyncOrchestratorService } from '@core/sync/services/offlineFirstSyncOrchestratorService';
import { networkConnectivityService } from '@core/sync/services/networkConnectivityService';
import { syncMetadataRepository } from '@core/sync/repositories/syncMetadataRepository';
import { syncOutboxRepository } from '@core/sync/repositories/syncOutboxRepository';
import { handleError } from '@error/errorHandler';

interface CloudSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastMessage: string | null;
  firebaseConfigured: boolean;
  hasPendingSync: boolean;
  setOnline: (online: boolean) => void;
  refreshMetadata: () => Promise<void>;
  refreshPendingSync: () => Promise<void>;
  syncNow: () => Promise<string>;
}

export const useCloudSyncStore = create<CloudSyncState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  lastSyncedAt: null,
  lastMessage: null,
  firebaseConfigured: isFirebaseConfigured(),
  hasPendingSync: false,

  setOnline: online => set({ isOnline: online }),

  refreshMetadata: async () => {
    const meta = await syncMetadataRepository.get();
    set({ lastSyncedAt: meta.lastSyncedAt });
  },

  refreshPendingSync: async () => {
    const entries = await syncOutboxRepository.getAll();
    set({ hasPendingSync: entries.length > 0 });
  },

  syncNow: async () => {
    set({ isSyncing: true });
    try {
      const result = await offlineFirstSyncOrchestratorService.syncWithCloud();
      await get().refreshMetadata();
      await get().refreshPendingSync();
      set({ lastMessage: result.message });
      return result.message;
    } catch (error) {
      const message = handleError(error, 'useCloudSyncStore.syncNow');
      set({ lastMessage: message });
      return message;
    } finally {
      set({ isSyncing: false });
    }
  },
}));

/** Subscribes to connectivity and updates the sync store. Call once at app start. */
export const startCloudSyncConnectivityListener = (): (() => void) => {
  return networkConnectivityService.subscribe(online => {
    useCloudSyncStore.getState().setOnline(online);
    const isAuthenticated =
      useFirebaseAuthStore.getState().status === 'authenticated' &&
      Boolean(getCurrentFirebaseUser());
    if (online && isFirebaseConfigured() && isAuthenticated) {
      useCloudSyncStore.getState().syncNow();
    }
  });
};
