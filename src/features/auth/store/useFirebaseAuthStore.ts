import type { User } from 'firebase/auth';
import { create } from 'zustand';

export type FirebaseAuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface FirebaseAuthState {
  status: FirebaseAuthStatus;
  user: User | null;
  sessionExpiredMessage: string | null;
  setInitializing: () => void;
  setAuthenticated: (user: User) => void;
  setUnauthenticated: () => void;
  markSessionExpired: (message: string) => void;
  clearSessionExpiredMessage: () => void;
}

export const useFirebaseAuthStore = create<FirebaseAuthState>(set => ({
  status: 'initializing',
  user: null,
  sessionExpiredMessage: null,

  setInitializing: () =>
    set({
      status: 'initializing',
    }),

  setAuthenticated: user =>
    set({
      status: 'authenticated',
      user,
      sessionExpiredMessage: null,
    }),

  setUnauthenticated: () =>
    set({
      status: 'unauthenticated',
      user: null,
    }),

  markSessionExpired: message =>
    set({
      status: 'unauthenticated',
      user: null,
      sessionExpiredMessage: message,
    }),

  clearSessionExpiredMessage: () => set({ sessionExpiredMessage: null }),
}));
