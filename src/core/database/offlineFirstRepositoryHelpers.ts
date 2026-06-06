import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { cloudEntityWriteService } from '@core/sync/services/cloudEntityWriteService';

type Identifiable = { id: string };
type ReplaceLocalEntity<T extends Identifiable> = (entity: T) => Promise<void>;

/**
 * Persists to AsyncStorage via `saveLocal`, then queues or pushes to Firestore.
 */
export const saveEntityWithCloudSync = async <T extends Identifiable>(
  collectionName: FirestoreCollectionName,
  saveLocal: () => Promise<T>,
  replaceLocal?: ReplaceLocalEntity<T>,
): Promise<T> => {
  const entity = await saveLocal();
  const cloudReadyEntity = await cloudEntityWriteService.upsertEntity(collectionName, entity);

  if (cloudReadyEntity !== entity && replaceLocal) {
    await replaceLocal(cloudReadyEntity);
  }

  return cloudReadyEntity;
};
