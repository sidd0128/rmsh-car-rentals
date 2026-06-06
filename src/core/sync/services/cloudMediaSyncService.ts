import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import type { FirestoreCollectionName } from '@core/firebase/constants/firestoreCollectionNames';
import { firebaseStorageMediaService } from '@core/firebase/services/firebaseStorageMediaService';
import { logError } from '@error/errorLogger';

type SyncableEntity = { id: string };
interface PrepareEntityForCloudOptions {
  showUploadErrors?: boolean;
}

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
  options: PrepareEntityForCloudOptions,
): Promise<string> => {
  if (isRemoteUri(uri) || !isUploadableLocalUri(uri)) {
    return uri;
  }

  try {
    return await firebaseStorageMediaService.uploadLocalImage({
      uri,
      storagePath: buildStoragePath(collectionName, entityId, fieldName, index, uri),
    });
  } catch (error) {
    if (options.showUploadErrors ?? true) {
      logError(error, {
        source: `cloudMediaSyncService.uploadUriIfNeeded.${collectionName}.${fieldName}`,
      });
    } else if (__DEV__) {
      console.warn(
        `[RMSHRentals] Could not migrate local media URI for ${collectionName}.${fieldName}`,
        error,
      );
    }
    return uri;
  }
};

const mergeRemoteMediaValue = (localValue: unknown, remoteValue: unknown): unknown => {
  if (typeof remoteValue === 'string' && isRemoteUri(remoteValue)) {
    return typeof localValue === 'string' && isRemoteUri(localValue) ? localValue : remoteValue;
  }

  if (Array.isArray(remoteValue)) {
    const localItems = Array.isArray(localValue) ? localValue : [];
    const maxLength = Math.max(localItems.length, remoteValue.length);

    return Array.from({ length: maxLength }, (_, index) => {
      const localItem = localItems[index];
      const remoteItem = remoteValue[index];

      if (typeof remoteItem === 'string' && isRemoteUri(remoteItem)) {
        return typeof localItem === 'string' && isRemoteUri(localItem) ? localItem : remoteItem;
      }

      return localItem ?? remoteItem;
    }).filter(item => item !== undefined);
  }

  return localValue;
};

const stripLocalMediaValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return isUploadableLocalUri(value) ? null : value;
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && !isUploadableLocalUri(item),
    );
  }

  return value;
};

const stripLocalMediaValueForLocalStore = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return isUploadableLocalUri(value) ? undefined : value;
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && !isUploadableLocalUri(item),
    );
  }

  return value;
};

const uploadMediaValue = async (
  collectionName: FirestoreCollectionName,
  entityId: string,
  fieldName: string,
  value: unknown,
  options: PrepareEntityForCloudOptions,
): Promise<unknown> => {
  if (typeof value === 'string') {
    return uploadUriIfNeeded(collectionName, entityId, fieldName, 0, value, options);
  }

  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item, index) =>
        typeof item === 'string'
          ? uploadUriIfNeeded(collectionName, entityId, fieldName, index, item, options)
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
    options: PrepareEntityForCloudOptions = {},
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
        options,
      );

      if (nextValue !== currentValue) {
        prepared[fieldName] = nextValue;
        hasChanges = true;
      }
    }

    return hasChanges ? (prepared as T) : entity;
  },

  mergeRemoteMediaUrls<T extends SyncableEntity>(
    collectionName: FirestoreCollectionName,
    localEntity: T,
    remoteEntity: T | undefined,
  ): T {
    const mediaFields = mediaFieldsByCollection[collectionName];
    if (!remoteEntity || !mediaFields?.length) {
      return localEntity;
    }

    let hasChanges = false;
    const merged = { ...localEntity } as Record<string, unknown> & SyncableEntity;
    const remote = remoteEntity as Record<string, unknown>;

    for (const fieldName of mediaFields) {
      const nextValue = mergeRemoteMediaValue(merged[fieldName], remote[fieldName]);
      if (nextValue !== merged[fieldName]) {
        merged[fieldName] = nextValue;
        hasChanges = true;
      }
    }

    return hasChanges ? (merged as T) : localEntity;
  },

  stripLocalMediaUrisForCloud<T extends SyncableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
  ): T {
    const mediaFields = mediaFieldsByCollection[collectionName];
    if (!mediaFields?.length) {
      return entity;
    }

    let hasChanges = false;
    const cloudSafeEntity = { ...entity } as Record<string, unknown> & SyncableEntity;

    for (const fieldName of mediaFields) {
      const nextValue = stripLocalMediaValue(cloudSafeEntity[fieldName]);
      if (nextValue !== cloudSafeEntity[fieldName]) {
        cloudSafeEntity[fieldName] = nextValue;
        hasChanges = true;
      }
    }

    return hasChanges ? (cloudSafeEntity as T) : entity;
  },

  stripLocalMediaUrisForLocalStore<T extends SyncableEntity>(
    collectionName: FirestoreCollectionName,
    entity: T,
  ): T {
    const mediaFields = mediaFieldsByCollection[collectionName];
    if (!mediaFields?.length) {
      return entity;
    }

    let hasChanges = false;
    const localSafeEntity = { ...entity } as Record<string, unknown> & SyncableEntity;

    for (const fieldName of mediaFields) {
      const nextValue = stripLocalMediaValueForLocalStore(localSafeEntity[fieldName]);
      if (nextValue !== localSafeEntity[fieldName]) {
        localSafeEntity[fieldName] = nextValue;
        hasChanges = true;
      }
    }

    return hasChanges ? (localSafeEntity as T) : entity;
  },
};
