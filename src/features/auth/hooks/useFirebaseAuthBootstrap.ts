import { useEffect } from 'react';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import {
  initializeFirebaseAuth,
  subscribeToFirebaseAuthState,
  waitForFirebaseAuthReady,
} from '@core/firebase/auth/services/firebaseAuthService';
import { useFirebaseAuthStore } from '../store/useFirebaseAuthStore';

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
    initializeFirebaseAuth();

    const unsubscribe = subscribeToFirebaseAuthState(user => {
      if (user) {
        setAuthenticated(user);
      } else {
        setUnauthenticated();
      }
    });

    void waitForFirebaseAuthReady();

    return unsubscribe;
  }, [setAuthenticated, setInitializing, setUnauthenticated]);
};
