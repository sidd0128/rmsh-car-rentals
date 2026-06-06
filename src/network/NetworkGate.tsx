import React from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@app/theme';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { NoInternetScreen } from './NoInternetScreen';
import { useNetworkStatus } from './useNetworkStatus';

interface NetworkGateProps {
  children: ReactNode;
}

export const NetworkGate = ({ children }: NetworkGateProps) => {
  const { isConnected, isInternetReachable, isRefreshing, refresh } = useNetworkStatus();
  const authStatus = useFirebaseAuthStore(s => s.status);
  const shouldRequireInternetForLogin = isFirebaseConfigured() && authStatus !== 'authenticated';
  const isCheckingInitialStatus = isConnected === null && isInternetReachable === null;
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!shouldRequireInternetForLogin) {
    return <>{children}</>;
  }

  if (isCheckingInitialStatus) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isOffline) {
    return <NoInternetScreen isRefreshing={isRefreshing} onRefresh={refresh} />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
