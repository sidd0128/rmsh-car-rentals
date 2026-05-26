import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { executeWithFreshFirebaseSession } from '@core/firebase/auth/services/firebaseAuthSessionService';
import { getFirestoreDatabaseOrNull } from './firestoreDatabaseService';

type SyncableDocument = { id: string };

/** Strips undefined values so Firestore accepts the payload. */
const sanitizeForFirestore = <T extends Record<string, unknown>>(data: T): T => {
  const clean = { ...data };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      delete clean[key];
    }
  });
  return clean;
};

/**
 * Low-level Firestore CRUD used by the offline-first sync layer.
 * All calls run through `executeWithFreshFirebaseSession` for token refresh on auth errors.
 */
export const firestoreDocumentSyncService = {
  async fetchAllDocuments<T extends SyncableDocument>(
    collectionName: FirestoreCollectionName,
  ): Promise<T[]> {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return [];
    }

    return executeWithFreshFirebaseSession(async () => {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(documentSnapshot => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as Omit<T, 'id'>),
      })) as T[];
    });
  },

  async upsertDocument<T extends SyncableDocument>(
    collectionName: FirestoreCollectionName,
    entity: T,
  ): Promise<void> {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return;
    }

    const { id, ...rest } = entity;
    await executeWithFreshFirebaseSession(() =>
      setDoc(doc(db, collectionName, id), sanitizeForFirestore(rest), { merge: true }),
    );
  },

  async deleteDocument(
    collectionName: FirestoreCollectionName,
    documentId: string,
  ): Promise<void> {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return;
    }

    await executeWithFreshFirebaseSession(() =>
      deleteDoc(doc(db, collectionName, documentId)),
    );
  },
};
