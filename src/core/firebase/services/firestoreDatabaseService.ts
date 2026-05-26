import { Firestore, getFirestore } from 'firebase/firestore';
import { getFirebaseAppOrNull } from './firebaseAppInitializationService';

/**
 * Provides the Firestore database instance for cloud read/write operations.
 */
export const getFirestoreDatabaseOrNull = (): Firestore | null => {
  const app = getFirebaseAppOrNull();
  if (!app) {
    return null;
  }
  return getFirestore(app);
};
