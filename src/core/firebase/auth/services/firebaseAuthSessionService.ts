import {
  getCurrentFirebaseUser,
  signOutFirebaseUser,
} from './firebaseAuthService';
import { resetDomainStores } from '@core/storage/resetDomainStores';
import {
  isSessionRelatedFirebaseError,
  isTokenRefreshFailure,
} from '../utils/firebaseAuthErrorUtils';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';

/**
 * Ensures a signed-in user exists before cloud operations.
 */
export const ensureFirebaseUserIsAuthenticated = (): void => {
  const user = getCurrentFirebaseUser();
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }
};

/**
 * Returns a valid ID token. Firebase refreshes automatically; `forceRefresh` is used
 * after permission-denied errors (Firestore security rules / expired token).
 */
export const getValidFirebaseIdToken = async (
  forceRefresh = false,
): Promise<string> => {
  const user = getCurrentFirebaseUser();
  if (!user) {
    throw new Error('AUTH_REQUIRED');
  }
  return user.getIdToken(forceRefresh);
};

/**
 * Signs the user out and resets auth UI state when the session cannot be recovered.
 */
export const handleUnrecoverableAuthSession = async (): Promise<void> => {
  await signOutFirebaseUser();
  resetDomainStores();
  useFirebaseAuthStore.getState().markSessionExpired(
    'Your session expired. Please sign in again.',
  );
};

/**
 * Runs a Firestore (or other Firebase) operation with one automatic token refresh retry
 * when the backend rejects the call for auth reasons — no manual token storage.
 */
export const executeWithFreshFirebaseSession = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  ensureFirebaseUserIsAuthenticated();

  try {
    return await operation();
  } catch (error) {
    if (!isSessionRelatedFirebaseError(error)) {
      throw error;
    }

    const user = getCurrentFirebaseUser();
    if (!user) {
      await handleUnrecoverableAuthSession();
      throw error;
    }

    try {
      await getValidFirebaseIdToken(true);
      return await operation();
    } catch (retryError) {
      if (isTokenRefreshFailure(retryError) || isSessionRelatedFirebaseError(retryError)) {
        await handleUnrecoverableAuthSession();
      }
      throw retryError;
    }
  }
};
