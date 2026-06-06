import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@app/theme';
import { LanguageProvider } from '@contextApis/language/LanguageProvider';
import { ThemeProvider } from '@contextApis/theme/ThemeProvider';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { offlineFirstSyncOrchestratorService } from '@core/sync/services/offlineFirstSyncOrchestratorService';
import {
  startCloudSyncConnectivityListener,
  useCloudSyncStore,
} from '@core/store/useCloudSyncStore';
import { handleError } from '@error/errorHandler';
import { useFirebaseAuthBootstrap } from '@features/auth/hooks/useFirebaseAuthBootstrap';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { NetworkGate } from '@network/NetworkGate';
import { NetworkProvider } from '@network/NetworkProvider';
import { GlobalUiHost } from '@shared/ui/GlobalUiHost';
import { AuthGate } from './AuthGate';

const renderPaperIcon = (props: React.ComponentProps<typeof MaterialCommunityIcons>) => (
  <MaterialCommunityIcons {...props} />
);

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { paperTheme } = useThemeContext();

  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        icon: renderPaperIcon,
      }}
    >
      <BottomSheetModalProvider>
        <GlobalUiHost />
        {children}
      </BottomSheetModalProvider>
    </PaperProvider>
  );
};

const AppRuntime = () => (
  <AppShell>
    <NetworkProvider>
      <NetworkGate>
        <AuthGate />
      </NetworkGate>
    </NetworkProvider>
  </AppShell>
);

export const AppProvider = () => {
  const [dataReady, setDataReady] = useState(false);
  const { hydrateAll } = useHydrateStores();
  const authStatus = useFirebaseAuthStore(s => s.status);

  useFirebaseAuthBootstrap();

  useEffect(() => {
    const loadAppData = async () => {
      try {
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
      } catch (error) {
        const message = handleError(error, 'AppProvider.loadAppData');
        useCloudSyncStore.setState({ lastMessage: message });

        try {
          await hydrateAll();
        } finally {
          setDataReady(true);
        }
      }
    };

    loadAppData().catch(error => {
      const message = handleError(error, 'AppProvider.loadAppData.effect');
      useCloudSyncStore.setState({ lastMessage: message });
      setDataReady(true);
    });
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
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AppShell>
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              </AppShell>
            </LanguageProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppRuntime />
          </LanguageProvider>
        </ThemeProvider>
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
