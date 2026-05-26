import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { paperTheme, colors } from '@app/theme';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { offlineFirstSyncOrchestratorService } from '@core/sync/services/offlineFirstSyncOrchestratorService';
import {
  startCloudSyncConnectivityListener,
  useCloudSyncStore,
} from '@core/store/useCloudSyncStore';
import { useFirebaseAuthBootstrap } from '@features/auth/hooks/useFirebaseAuthBootstrap';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { RootNavigator } from '../navigation/RootNavigator';

export const AppProvider = () => {
  const [dataReady, setDataReady] = useState(false);
  const { hydrateAll } = useHydrateStores();
  const authStatus = useFirebaseAuthStore(s => s.status);

  useFirebaseAuthBootstrap();

  useEffect(() => {
    const loadAppData = async () => {
      const firebaseConfigured = isFirebaseConfigured();
      const isAuthenticated = authStatus === 'authenticated';

      if (firebaseConfigured && !isAuthenticated) {
        setDataReady(true);
        return;
      }

      if (authStatus === 'initializing' && firebaseConfigured) {
        return;
      }

      setDataReady(false);

      if (firebaseConfigured && isAuthenticated) {
        const syncResult = await offlineFirstSyncOrchestratorService.syncWithCloud();
        useCloudSyncStore.setState({ lastMessage: syncResult.message });
        await useCloudSyncStore.getState().refreshMetadata();
      }

      await hydrateAll();
      await useCloudSyncStore.getState().refreshPendingSync();
      setDataReady(true);
    };

    void loadAppData();
  }, [authStatus, hydrateAll]);

  useEffect(() => {
    const unsubscribe = startCloudSyncConnectivityListener();
    return unsubscribe;
  }, []);

  const firebaseConfigured = isFirebaseConfigured();
  const waitingForAuth = firebaseConfigured && authStatus === 'initializing';
  const waitingForData =
    !dataReady &&
    (!firebaseConfigured || authStatus === 'authenticated') &&
    authStatus !== 'unauthenticated';

  if (waitingForAuth || waitingForData) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <PaperProvider
          theme={paperTheme}
          settings={{
            icon: props => <MaterialCommunityIcons {...props} />,
          }}
        >
          <BottomSheetModalProvider>
            <RootNavigator />
          </BottomSheetModalProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
