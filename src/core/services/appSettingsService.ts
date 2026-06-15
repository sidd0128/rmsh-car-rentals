import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_NAMES } from '@core/firebase/constants/firestoreCollectionNames';
import { executeWithFreshFirebaseSession } from '@core/firebase/auth/services/firebaseAuthSessionService';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { storageService } from '@core/storage/storageService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import type { AppSettings } from '@core/types/domain';

const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'global',
  autoAcceptNewBookingRequests: false,
};

const nowISO = (): string => new Date().toISOString();

const readLocalSettings = async (): Promise<AppSettings> => {
  const settings = await storageService.getItem<AppSettings>(STORAGE_KEYS.APP_SETTINGS);
  return settings ?? DEFAULT_APP_SETTINGS;
};

const writeLocalSettings = (settings: AppSettings): Promise<void> =>
  storageService.setItem(STORAGE_KEYS.APP_SETTINGS, settings);

export const appSettingsService = {
  async getSettings(): Promise<AppSettings> {
    const db = getFirestoreDatabaseOrNull();
    if (!db) {
      return readLocalSettings();
    }

    try {
      return await executeWithFreshFirebaseSession(async () => {
        const snapshot = await getDoc(
          doc(db, FIRESTORE_COLLECTION_NAMES.APP_SETTINGS, 'global'),
        );
        const settings = snapshot.exists()
          ? ({ id: 'global', ...snapshot.data() } as AppSettings)
          : DEFAULT_APP_SETTINGS;
        await writeLocalSettings(settings);
        return settings;
      });
    } catch {
      return readLocalSettings();
    }
  },

  async setAutoAcceptNewBookingRequests(enabled: boolean): Promise<AppSettings> {
    const current = await this.getSettings();
    const timestamp = nowISO();
    const next: AppSettings = {
      ...current,
      autoAcceptNewBookingRequests: enabled,
      updatedAt: timestamp,
      createdAt: current.createdAt ?? timestamp,
    };

    const db = getFirestoreDatabaseOrNull();
    if (db) {
      await executeWithFreshFirebaseSession(() =>
        setDoc(
          doc(db, FIRESTORE_COLLECTION_NAMES.APP_SETTINGS, 'global'),
          {
            autoAcceptNewBookingRequests: next.autoAcceptNewBookingRequests,
            createdAt: next.createdAt,
            updatedAt: next.updatedAt,
          },
          { merge: true },
        ),
      );
    }

    await writeLocalSettings(next);
    return next;
  },
};
