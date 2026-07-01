import { Platform } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getCurrentFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirestoreDatabaseOrNull } from '@core/firebase/services/firestoreDatabaseService';
import { todayISO } from '@core/helpers/date';
import { storageService } from '@core/storage/storageService';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { logError } from '@error/errorLogger';
import { pushNotificationDisplayService } from './pushNotificationDisplayService';

const DEVICE_TOKENS_COLLECTION = 'deviceTokens';

const tokenDocumentId = (token: string): string => encodeURIComponent(token);

const getStoredToken = (): Promise<string | null> =>
  storageService.getItem<string>(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN);

const setStoredToken = (token: string): Promise<void> =>
  storageService.setItem(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN, token);

const removeStoredToken = (): Promise<void> =>
  storageService.removeItem(STORAGE_KEYS.PUSH_NOTIFICATION_TOKEN);

const saveTokenToFirestore = async (token: string): Promise<void> => {
  const db = getFirestoreDatabaseOrNull();
  const user = getCurrentFirebaseUser();
  if (!db || !user) {
    return;
  }

  await setDoc(
    doc(db, DEVICE_TOKENS_COLLECTION, tokenDocumentId(token)),
    {
      token,
      userId: user.uid,
      platform: Platform.OS,
      role: 'admin',
      enabled: true,
      updatedAt: todayISO(),
    },
    { merge: true },
  );
};

const deleteTokenFromFirestore = async (token: string): Promise<void> => {
  const db = getFirestoreDatabaseOrNull();
  if (!db) {
    return;
  }

  await deleteDoc(doc(db, DEVICE_TOKENS_COLLECTION, tokenDocumentId(token)));
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
    await storageService.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS_ENABLED, enabled);
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
      notificationSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      notificationSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (!allowed) {
      await storageService.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS_ENABLED, false);
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
