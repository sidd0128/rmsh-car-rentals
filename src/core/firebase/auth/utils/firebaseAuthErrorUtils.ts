import i18n from '@core/i18n';
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
    return i18n.t('auth.errors.generic');
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return i18n.t('auth.errors.invalidEmail');
    case 'auth/user-disabled':
      return i18n.t('auth.errors.userDisabled');
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return i18n.t('auth.errors.wrongPassword');
    case 'auth/email-already-in-use':
      return i18n.t('auth.errors.emailInUse');
    case 'auth/weak-password':
      return i18n.t('auth.errors.weakPassword');
    case 'auth/too-many-requests':
      return i18n.t('auth.errors.tooManyRequests');
    case 'auth/network-request-failed':
      return i18n.t('auth.errors.network');
    default:
      return error.message || i18n.t('auth.errors.authFailed');
  }
};
