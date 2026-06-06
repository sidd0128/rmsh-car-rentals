import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { executeWithFreshFirebaseSession } from '@core/firebase/auth/services/firebaseAuthSessionService';
import { env } from '@core/config/env';
import { isFirebaseStorageConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getFirebaseAppOrNull } from './firebaseAppInitializationService';

interface UploadMediaParams {
  uri: string;
  storagePath: string;
}

interface DeleteMediaParams {
  downloadUrl: string;
}

const getContentTypeFromUri = (uri: string): string => {
  const normalized = uri.toLowerCase();

  if (normalized.includes('.png')) {
    return 'image/png';
  }

  if (normalized.includes('.webp')) {
    return 'image/webp';
  }

  if (normalized.includes('.heic') || normalized.includes('.heif')) {
    return 'image/heic';
  }

  return 'image/jpeg';
};

const readErrorValue = (error: unknown, key: string): unknown => {
  if (typeof error !== 'object' || error === null || !(key in error)) {
    return undefined;
  }

  return error[key as keyof typeof error];
};

const parseServerResponse = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  const raw = String(value);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string } };
    const message = parsed.error?.message;
    const status = parsed.error?.status;
    return [message, status].filter(Boolean).join(' ');
  } catch {
    return raw;
  }
};

const buildStorageError = (
  error: unknown,
  storagePath: string,
  stage: string,
): Error => {
  const code = readErrorValue(error, 'code');
  const message = readErrorValue(error, 'message');
  const customData = readErrorValue(error, 'customData') as
    | { serverResponse?: string; status?: number }
    | undefined;
  const serverResponse = parseServerResponse(customData?.serverResponse);

  return new Error(
    [
      `Firebase Storage ${stage} failed.`,
      code ? `Code: ${String(code)}` : undefined,
      message ? `Message: ${String(message)}` : undefined,
      customData?.status ? `HTTP status: ${customData.status}` : undefined,
      `Bucket: ${env.firebase.storageBucket}`,
      `Path: ${storagePath}`,
      serverResponse ? `Server response: ${serverResponse}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  );
};

/**
 * Uploads a React Native local media URI to Firebase Storage and returns its
 * stable download URL. Firestore stores this URL, never the temporary file path.
 */
export const firebaseStorageMediaService = {
  async uploadLocalImage({ uri, storagePath }: UploadMediaParams): Promise<string> {
    if (!isFirebaseStorageConfigured()) {
      throw new Error(
        'Firebase Storage is not configured. Set FIREBASE_STORAGE_BUCKET in the app environment.',
      );
    }

    const app = getFirebaseAppOrNull();
    if (!app) {
      throw new Error('Firebase is not initialized, so the image could not be uploaded.');
    }

    return executeWithFreshFirebaseSession(async () => {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Could not read local image file. HTTP status: ${response.status}`);
      }

      const blob = await response.blob();
      const storage = getStorage(app);
      const mediaRef = ref(storage, storagePath);

      try {
        await uploadBytes(mediaRef, blob, {
          contentType: getContentTypeFromUri(uri),
        });
      } catch (error) {
        throw buildStorageError(error, storagePath, 'upload');
      }

      try {
        return await getDownloadURL(mediaRef);
      } catch (error) {
        throw buildStorageError(error, storagePath, 'download URL');
      }
    });
  },

  async deleteRemoteImage({ downloadUrl }: DeleteMediaParams): Promise<void> {
    if (!isFirebaseStorageConfigured()) {
      return;
    }

    const app = getFirebaseAppOrNull();
    if (!app) {
      return;
    }

    await executeWithFreshFirebaseSession(async () => {
      const storage = getStorage(app);
      const mediaRef = ref(storage, downloadUrl);

      try {
        await deleteObject(mediaRef);
      } catch (error) {
        const code = readErrorValue(error, 'code');
        if (code === 'storage/object-not-found') {
          return;
        }

        throw buildStorageError(error, downloadUrl, 'delete');
      }
    });
  },
};
