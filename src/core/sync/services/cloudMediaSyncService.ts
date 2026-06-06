import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { firebaseStorageMediaService } from '@core/firebase/services/firebaseStorageMediaService';

type SyncableEntity = { id: string };

const mediaFieldsByCollection: Partial<Record<FirestoreCollectionName, string[]>> = {
  [FIRESTORE_COLLECTION_NAMES.CARS]: ['images'],
  [FIRESTORE_COLLECTION_NAMES.CUSTOMERS]: [
    'photo',
    'drivingLicenseImages',
    'documents',
  ],
  [FIRESTORE_COLLECTION_NAMES.FINES]: ['proofImages'],
  [FIRESTORE_COLLECTION_NAMES.ACCIDENTS]: ['proofImages'],
};

const isRemoteUri = (uri: string): boolean =>
  uri.startsWith('http://') || uri.startsWith('https://');

const isUploadableLocalUri = (uri: string): boolean =>
  uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');

const getExtension = (uri: string): string => {
  const match = uri.match(/\.(jpe?g|png|webp|heic|heif)(?:\?|$)/i);
  return match?.[1]?.toLowerCase() ?? 'jpg';
};

const sanitizePathSegment = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');

const buildStoragePath = (
  collectionName: FirestoreCollectionName,
  entityId: string,
  fieldName: string,
  index: number,
  uri: string,
): string => {
  const extension = getExtension(uri);
  return [
    'media',
    sanitizePathSegment(collectionName),
    sanitizePathSegment(entityId),
    `${sanitizePathSegment(fieldName)}-${index}.${extension}`,
  ].join('/');
};

const uploadUriIfNeeded = async (
  collectionName: FirestoreCollectionName,
  entityId: string,
  fieldName: string,
  index: number,
  uri: string,
): Promise<string> => {
  if (isRemoteUri(uri) || !isUploadableLocalUri(uri)) {
    return uri;
  }

  try {
    return await firebaseStorageMediaService.uploadLocalImage({
      uri,
      storagePath: buildStoragePath(collectionName, entityId, fieldName, index, uri),
    });
  } catch {
    return uri;
  }
};

const uploadMediaValue = async (
  collectionName: FirestoreCollectionName,
  entityId: string,
  fieldName: string,
  value: unknown,
): Promise<unknown> => {
  if (typeof value === 'string') {
    return uploadUriIfNeeded(collectionName, entityId, fieldName, 0, value);
  }

  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item, index) =>
        typeof item === 'string'
          ? uploadUriIfNeeded(collectionName, entityId, fieldName, index, item)
          : item,
      ),
    );
  }

  return value;
};

/**
 * Converts local image file URIs in syncable entities into Firebase Storage URLs
 * before those entities are written to Firestore.
 */
export const cloudMediaSyncService = {
  async prepareEntityForCloud<T extends SyncableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
  ): Promise<T> {
    const mediaFields = mediaFieldsByCollection[collectionName];
    if (!mediaFields?.length) {
      return entity;
    }

    let hasChanges = false;
    const prepared = { ...entity } as Record<string, unknown> & SyncableEntity;

    for (const fieldName of mediaFields) {
      const currentValue = prepared[fieldName];
      const nextValue = await uploadMediaValue(
        collectionName,
        entity.id,
        fieldName,
        currentValue,
      );

      if (nextValue !== currentValue) {
        prepared[fieldName] = nextValue;
        hasChanges = true;
      }
    }

    return hasChanges ? (prepared as T) : entity;
  },
};
