import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { executeWithFreshFirebaseSession } from '@core/firebase/auth/services/firebaseAuthSessionService';
import { isFirebaseStorageConfigured } from '@core/firebase/config/firebaseAppConfig';
import { getFirebaseAppOrNull } from './firebaseAppInitializationService';

interface UploadMediaParams {
  uri: string;
  storagePath: string;
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

/**
 * Uploads a React Native local media URI to Firebase Storage and returns its
 * stable download URL. Firestore stores this URL, never the temporary file path.
 */
export const firebaseStorageMediaService = {
  async uploadLocalImage({ uri, storagePath }: UploadMediaParams): Promise<string> {
    if (!isFirebaseStorageConfigured()) {
      return uri;
    }

    const app = getFirebaseAppOrNull();
    if (!app) {
      return uri;
    }

    return executeWithFreshFirebaseSession(async () => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage(app);
      const mediaRef = ref(storage, storagePath);

      await uploadBytes(mediaRef, blob, {
        contentType: getContentTypeFromUri(uri),
      });

      return getDownloadURL(mediaRef);
    });
  },
};
