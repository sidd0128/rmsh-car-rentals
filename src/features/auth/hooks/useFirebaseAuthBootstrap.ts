import { useEffect } from 'react';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import {
  getCurrentFirebaseUser,
  initializeFirebaseAuth,
  subscribeToFirebaseAuthState,
  waitForFirebaseAuthReady,
} from '@core/firebase/auth/services/firebaseAuthService';
import { logError } from '@error/errorLogger';
import { useFirebaseAuthStore } from '../store/useFirebaseAuthStore';

const AUTH_BOOTSTRAP_TIMEOUT_MS = 15000;

/**
 * Restores the Firebase session from AsyncStorage and keeps Zustand auth state in sync.
 */
export const useFirebaseAuthBootstrap = (): void => {
  const setAuthenticated = useFirebaseAuthStore(s => s.setAuthenticated);
  const setUnauthenticated = useFirebaseAuthStore(s => s.setUnauthenticated);
  const setInitializing = useFirebaseAuthStore(s => s.setInitializing);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUnauthenticated();
      return;
    }

    setInitializing();
    let hasReceivedAuthState = false;
    let unsubscribe: (() => void) | undefined;
    const timeoutId = setTimeout(() => {
      if (hasReceivedAuthState) {
        return;
      }

      logError(new Error('Firebase auth did not finish initializing.'), {
        source: 'useFirebaseAuthBootstrap.timeout',
      });

      const currentUser = getCurrentFirebaseUser();
      if (currentUser) {
        setAuthenticated(currentUser);
      } else {
        setUnauthenticated();
      }
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    try {
      initializeFirebaseAuth();

      unsubscribe = subscribeToFirebaseAuthState(user => {
        hasReceivedAuthState = true;
        clearTimeout(timeoutId);

        if (user) {
          setAuthenticated(user);
        } else {
          setUnauthenticated();
        }
      });

      waitForFirebaseAuthReady().catch(error => {
        if (!hasReceivedAuthState) {
          logError(error, { source: 'useFirebaseAuthBootstrap.authStateReady' });
          setUnauthenticated();
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      logError(error, { source: 'useFirebaseAuthBootstrap.initialize' });
      setUnauthenticated();
    }

    return () => {
      clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [setAuthenticated, setInitializing, setUnauthenticated]);
};
