import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  FIREBASE_WEB_CONFIG,
  isFirebaseConfigured,
} from '@core/firebase/config/firebaseAppConfig';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

/**
 * Initializes Firebase App + Auth with official React Native persistence (AsyncStorage).
 */
export const initializeFirebaseAuth = (): Auth | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (firebaseAuth) {
    return firebaseAuth;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_WEB_CONFIG);

  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  return firebaseAuth;
};

export const getFirebaseAuthOrNull = (): Auth | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return firebaseAuth ?? initializeFirebaseAuth();
};

export const getFirebaseAuthOrThrow = (): Auth => {
  const auth = getFirebaseAuthOrNull();
  if (!auth) {
    throw new Error('Firebase Auth is not configured.');
  }
  return auth;
};

export const getCurrentFirebaseUser = (): User | null =>
  getFirebaseAuthOrNull()?.currentUser ?? null;

export const waitForFirebaseAuthReady = async (): Promise<void> => {
  const auth = getFirebaseAuthOrNull();
  if (!auth) {
    return;
  }
  await auth.authStateReady();
};

export const subscribeToFirebaseAuthState = (
  listener: (user: User | null) => void,
): (() => void) => {
  const auth = getFirebaseAuthOrThrow();
  return onAuthStateChanged(auth, listener);
};

export const signInWithEmail = (email: string, password: string) => {
  const auth = getFirebaseAuthOrThrow();
  return signInWithEmailAndPassword(auth, email.trim(), password);
};

export const registerWithEmail = (email: string, password: string) => {
  const auth = getFirebaseAuthOrThrow();
  return createUserWithEmailAndPassword(auth, email.trim(), password);
};

export const signOutFirebaseUser = () => {
  const auth = getFirebaseAuthOrNull();
  if (!auth) {
    return Promise.resolve();
  }
  return signOut(auth);
};
