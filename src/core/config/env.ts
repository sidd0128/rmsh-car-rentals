import {
  APP_ENV,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  SHOW_DEV_DATA_TOOLS,
} from './env.generated';

const parseBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const trimOrEmpty = (value: string | undefined): string => value?.trim() ?? '';

export type AppEnvironment = 'development' | 'staging' | 'production';

export const env = {
  appEnv: (trimOrEmpty(APP_ENV) || 'development') as AppEnvironment,
  showDevDataTools: parseBool(SHOW_DEV_DATA_TOOLS, true),
  firebase: {
    apiKey: trimOrEmpty(FIREBASE_API_KEY),
    authDomain: trimOrEmpty(FIREBASE_AUTH_DOMAIN),
    projectId: trimOrEmpty(FIREBASE_PROJECT_ID),
    storageBucket: trimOrEmpty(FIREBASE_STORAGE_BUCKET),
    messagingSenderId: trimOrEmpty(FIREBASE_MESSAGING_SENDER_ID),
    appId: trimOrEmpty(FIREBASE_APP_ID),
    measurementId: trimOrEmpty(FIREBASE_MEASUREMENT_ID),
  },
} as const;

export const isFirebaseEnvConfigured = (): boolean => {
  const { apiKey, projectId } = env.firebase;
  return (
    Boolean(apiKey && projectId) &&
    !apiKey.includes('YOUR_') &&
    !projectId.includes('YOUR_')
  );
};

/** Wipe-all-data section: dev build + env flag (off in client `.env`). */
export const showDevDataTools = (): boolean => __DEV__ && env.showDevDataTools;
