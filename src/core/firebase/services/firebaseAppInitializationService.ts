import { FirebaseApp, getApp, getApps } from 'firebase/app';
import { initializeFirebaseAuth } from '@core/firebase/auth/services/firebaseAuthService';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';

/**
 * Initializes Firebase App and Auth (React Native persistence).
 */
export const initializeFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  initializeFirebaseAuth();
  return getApps().length > 0 ? getApp() : null;
};

export const getFirebaseAppOrNull = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return initializeFirebaseApp();
};
