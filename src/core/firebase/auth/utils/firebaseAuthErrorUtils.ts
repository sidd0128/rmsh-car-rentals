import { FirebaseError } from 'firebase/app';

/** Firestore / Auth error codes that indicate an invalid or expired session. */
const SESSION_ERROR_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'auth/user-token-expired',
  'auth/id-token-expired',
  'auth/invalid-user-token',
  'auth/requires-recent-login',
]);

const TOKEN_REFRESH_FAILURE_CODES = new Set([
  'auth/user-token-expired',
  'auth/id-token-expired',
  'auth/invalid-user-token',
  'auth/user-disabled',
  'auth/user-not-found',
]);

const isFirebaseError = (error: unknown): error is FirebaseError =>
  error instanceof FirebaseError;

/** True when the server rejected access — often fixed by refreshing the ID token once. */
export const isSessionRelatedFirebaseError = (error: unknown): boolean => {
  if (!isFirebaseError(error)) {
    return false;
  }
  return SESSION_ERROR_CODES.has(error.code);
};

/** True when `getIdToken(true)` cannot recover the session — user must sign in again. */
export const isTokenRefreshFailure = (error: unknown): boolean => {
  if (!isFirebaseError(error)) {
    return false;
  }
  return TOKEN_REFRESH_FAILURE_CODES.has(error.code);
};

/** Maps Firebase Auth error codes to user-facing copy for the login UI. */
export const getFirebaseAuthErrorMessage = (error: unknown): string => {
  if (!isFirebaseError(error)) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return error.message || 'Authentication failed.';
  }
};
