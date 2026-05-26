import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { cloudEntityWriteService } from '@core/sync/services/cloudEntityWriteService';

type Identifiable = { id: string };

/**
 * Persists to AsyncStorage via `saveLocal`, then queues or pushes to Firestore.
 */
export const saveEntityWithCloudSync = async <T extends Identifiable>(
  collectionName: FirestoreCollectionName,
  saveLocal: () => Promise<T>,
): Promise<T> => {
  const entity = await saveLocal();
  await cloudEntityWriteService.upsertEntity(collectionName, entity);
  return entity;
};

/**
 * Deletes locally first, then removes from Firestore when online.
 */
export const deleteEntityWithCloudSync = async (
  collectionName: FirestoreCollectionName,
  deleteLocal: () => Promise<void>,
  documentId: string,
): Promise<void> => {
  await deleteLocal();
  await cloudEntityWriteService.deleteEntity(collectionName, documentId);
};
