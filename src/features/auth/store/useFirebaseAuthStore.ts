import type { User } from 'firebase/auth';
import { create } from 'zustand';

export type FirebaseAuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface FirebaseAuthState {
  status: FirebaseAuthStatus;
  user: User | null;
  authError: string | null;
  sessionExpiredMessage: string | null;
  setInitializing: () => void;
  setAuthenticated: (user: User) => void;
  setUnauthenticated: () => void;
  setAuthError: (message: string | null) => void;
  markSessionExpired: (message: string) => void;
  clearSessionExpiredMessage: () => void;
}

export const useFirebaseAuthStore = create<FirebaseAuthState>(set => ({
  status: 'initializing',
  user: null,
  authError: null,
  sessionExpiredMessage: null,

  setInitializing: () =>
    set({
      status: 'initializing',
      authError: null,
    }),

  setAuthenticated: user =>
    set({
      status: 'authenticated',
      user,
      authError: null,
      sessionExpiredMessage: null,
    }),

  setUnauthenticated: () =>
    set({
      status: 'unauthenticated',
      user: null,
    }),

  setAuthError: message => set({ authError: message }),

  markSessionExpired: message =>
    set({
      status: 'unauthenticated',
      user: null,
      sessionExpiredMessage: message,
    }),

  clearSessionExpiredMessage: () => set({ sessionExpiredMessage: null }),
}));
