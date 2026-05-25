import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { paperTheme, colors } from '@app/theme';
import { seedDatabaseIfNeeded } from '@core/database/seedData';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { RootNavigator } from '../navigation/RootNavigator';

export const AppProvider = () => {
  const [ready, setReady] = useState(false);
  const { hydrateAll } = useHydrateStores();

  useEffect(() => {
    const init = async () => {
      await seedDatabaseIfNeeded();
      await hydrateAll();
      setReady(true);
    };
    init();
  }, [hydrateAll]);

  if (!ready) {
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
