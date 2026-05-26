import { env, isFirebaseEnvConfigured } from '@core/config/env';

/** Firebase Web SDK config loaded from `.env` (see `.env.example`). */
export const FIREBASE_WEB_CONFIG = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
  ...(env.firebase.measurementId ? { measurementId: env.firebase.measurementId } : {}),
};

export const isFirebaseConfigured = isFirebaseEnvConfigured;
