import { Platform } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { createId } from '@core/helpers/id';
import { todayISO } from '@core/helpers/date';
import { storageService } from '@core/storage/storageService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { logError } from '@error/errorLogger';
import { pushNotificationDisplayService } from './pushNotificationDisplayService';

const DEVICE_TOKENS_COLLECTION = 'deviceTokens';

const tokenDocumentId = (token: string): string => encodeURIComponent(token);

const deviceTokenDocumentId = (userId: string, deviceId: string): string =>
  `${encodeURIComponent(userId)}_${encodeURIComponent(deviceId)}`;

const getStoredToken = (): Promise<string | null> =>
  storageService.getItem<string>(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN);

const setStoredToken = (token: string): Promise<void> =>
  storageService.setItem(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN, token);

const removeStoredToken = (): Promise<void> =>
  storageService.removeItem(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN);

const getOrCreateDeviceId = async (): Promise<string> => {
  const storedDeviceId = await storageService.getItem<string>(
    STORAGE_KEYS.PUSH_NOTIFICATION_DEVICE_ID,
  );
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = createId();
  await storageService.setItem(
    STORAGE_KEYS.PUSH_NOTIFICATION_DEVICE_ID,
    deviceId,
  );
  return deviceId;
};

const saveTokenToFirestore = async (token: string): Promise<void> => {
  const db = getFirestoreDatabaseOrNull();
  const user = getCurrentFirebaseUser();
  if (!db || !user) {
    return;
  }

  const [deviceId, previousToken] = await Promise.all([
    getOrCreateDeviceId(),
    getStoredToken(),
  ]);

  await setDoc(
    doc(
      db,
      DEVICE_TOKENS_COLLECTION,
      deviceTokenDocumentId(user.uid, deviceId),
    ),
    {
      token,
      userId: user.uid,
      deviceId,
      platform: Platform.OS,
      role: 'admin',
      enabled: true,
      createdAt: todayISO(),
      updatedAt: todayISO(),
    },
    { merge: true },
  );

  if (previousToken) {
    await deleteDoc(
      doc(db, DEVICE_TOKENS_COLLECTION, tokenDocumentId(previousToken)),
    ).catch(error => {
      logError(error, { source: 'pushNotificationService.deleteLegacyToken' });
    });
  }
};

const deleteTokenFromFirestore = async (token: string): Promise<void> => {
  const db = getFirestoreDatabaseOrNull();
  const user = getCurrentFirebaseUser();
  if (!db || !user) {
    return;
  }

  const deviceId = await getOrCreateDeviceId();
  await Promise.all([
    deleteDoc(
      doc(
        db,
        DEVICE_TOKENS_COLLECTION,
        deviceTokenDocumentId(user.uid, deviceId),
      ),
    ).catch(error => {
      logError(error, { source: 'pushNotificationService.deleteDeviceToken' });
    }),
    deleteDoc(doc(db, DEVICE_TOKENS_COLLECTION, tokenDocumentId(token))).catch(
      error => {
        logError(error, {
          source: 'pushNotificationService.deleteLegacyToken',
        });
      },
    ),
  ]);
};

export const pushNotificationService = {
  async isEnabled(): Promise<boolean> {
    return (
      (await storageService.getItem<boolean>(
        STORAGE_KEYS.PUSH_NOTIFICATIONS_ENABLED,
      )) ?? false
    );
  },

  async setEnabled(enabled: boolean): Promise<void> {
    await storageService.setItem(
      STORAGE_KEYS.PUSH_NOTIFICATIONS_ENABLED,
      enabled,
    );
    if (enabled) {
      await this.registerDevice();
    } else {
      await this.unregisterDevice();
    }
  },

  async registerDevice(): Promise<void> {
    const user = getCurrentFirebaseUser();
    if (!user) {
      return;
    }

    const notificationSettings = await notifee.requestPermission();
    const allowed =
      notificationSettings.authorizationStatus ===
        AuthorizationStatus.AUTHORIZED ||
      notificationSettings.authorizationStatus ===
        AuthorizationStatus.PROVISIONAL;

    if (!allowed) {
      await storageService.setItem(
        STORAGE_KEYS.PUSH_NOTIFICATIONS_ENABLED,
        false,
      );
      return;
    }

    await messaging().registerDeviceForRemoteMessages();
    await pushNotificationDisplayService.ensureBookingRequestChannel();
    const token = await messaging().getToken();
    await saveTokenToFirestore(token);
    await setStoredToken(token);
  },

  async unregisterDevice(): Promise<void> {
    const storedToken = await getStoredToken();
    if (storedToken) {
      await deleteTokenFromFirestore(storedToken);
    }
    await removeStoredToken();
  },

  async initialize(): Promise<() => void> {
    if (!(await this.isEnabled())) {
      return () => undefined;
    }

    try {
      await this.registerDevice();
    } catch (error) {
      logError(error, { source: 'pushNotificationService.registerDevice' });
    }

    const unsubscribeMessage = messaging().onMessage(remoteMessage =>
      pushNotificationDisplayService
        .displayBookingRequestNotification(remoteMessage)
        .catch(error =>
          logError(error, { source: 'pushNotificationService.onMessage' }),
        ),
    );

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      saveTokenToFirestore(token)
        .then(() => setStoredToken(token))
        .catch(error =>
          logError(error, {
            source: 'pushNotificationService.onTokenRefresh',
          }),
        );
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTokenRefresh();
    };
  },
};
