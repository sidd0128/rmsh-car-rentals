import React from 'react';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { RootNavigator } from '../navigation/RootNavigator';

export const AuthGate = () => {
  const status = useFirebaseAuthStore(s => s.status);
  const firebaseConfigured = isFirebaseConfigured();
  const showMainApp = !firebaseConfigured || status === 'authenticated';

  return <RootNavigator showMainApp={showMainApp} />;
};
