import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';

export type SyncOperationType = 'upsert' | 'delete';

export interface SyncOutboxEntry {
  id: string;
  collectionName: FirestoreCollectionName;
  operation: SyncOperationType;
  /** Entity payload for upsert, or { id } for delete */
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SyncMetadata {
  lastSyncedAt: string | null;
}
