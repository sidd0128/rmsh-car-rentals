import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { List, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { colors, radius, spacing, typography } from '@app/theme';
import { showDevDataTools } from '@core/config/env';
import { wipeAllAppData } from '@core/data/wipeAllAppData';
import { formatDateTime } from '@core/helpers/date';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { performAppLogout } from '@core/storage/performAppLogout';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton } from '@shared/ui';

const formatCloudWipeSummary = (
  cloudSkipped: boolean,
  deleted: Partial<Record<string, number>>,
): string => {
  if (cloudSkipped) {
    return 'Firebase was not cleared (sign in while online to wipe cloud data too).';
  }
  const total = Object.values(deleted).reduce<number>(
    (sum, count) => sum + (count ?? 0),
    0,
  );
  return `Firebase cleared (${total} documents removed).`;
};

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { hydrateAll } = useHydrateStores();
  const authUser = useFirebaseAuthStore(s => s.user);
  const isOnline = useCloudSyncStore(s => s.isOnline);
  const isSyncing = useCloudSyncStore(s => s.isSyncing);
  const lastSyncedAt = useCloudSyncStore(s => s.lastSyncedAt);
  const lastMessage = useCloudSyncStore(s => s.lastMessage);
  const firebaseConfigured = useCloudSyncStore(s => s.firebaseConfigured);
  const hasPendingSync = useCloudSyncStore(s => s.hasPendingSync);
  const refreshPendingSync = useCloudSyncStore(s => s.refreshPendingSync);
  const syncNow = useCloudSyncStore(s => s.syncNow);
  const authStatus = useFirebaseAuthStore(s => s.status);
  const showSyncButton =
    firebaseConfigured && authStatus === 'authenticated' && hasPendingSync;
  const [wipingAll, setWipingAll] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshPendingSync();
    }, [refreshPendingSync]),
  );

  const handleSync = async () => {
    const message = await syncNow();
    await hydrateAll();
    Alert.alert('Cloud sync', message);
  };

  const handleWipeAllData = () => {
    Alert.alert(
      'Wipe all data',
      'This permanently deletes all cars, customers, rentals, payments, fines, and accidents from this device and from Firebase (when signed in). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe all data',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setWipingAll(true);
              const result = await wipeAllAppData();
              await hydrateAll();
              await refreshPendingSync();
              setWipingAll(false);
              Alert.alert(
                'All data wiped',
                `Local storage is empty. ${formatCloudWipeSummary(
                  result.cloudSkipped,
                  result.cloudDeletedByCollection,
                )}`,
              );
            })();
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will return to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void performAppLogout();
        },
      },
    ]);
  };

  return (
    <ScreenLayout onRefresh={handleSync} refreshing={isSyncing}>
      <Text style={typography.h2}>More</Text>
      <Text style={styles.lead}>Account, sync, and fleet compliance tools.</Text>

      <View style={screenStyles.syncCard}>
        <Text style={typography.h3}>Account</Text>
        {authUser?.email ? (
          <Text style={styles.syncLine}>Signed in as {authUser.email}</Text>
        ) : null}
        <AppButton
          label="Sign out"
          variant="outline"
          onPress={handleSignOut}
          fullWidth
        />
      </View>

      {showDevDataTools() ? (
        <View style={screenStyles.syncCard}>
          <Text style={typography.h3}>Data (development only)</Text>
          <Text style={styles.syncHint}>
            Removes everything from the app and Firebase. You stay signed in so you can start
            fresh immediately. Hidden in release builds for clients.
          </Text>
          <AppButton
            label="Wipe all data"
            variant="danger"
            onPress={handleWipeAllData}
            loading={wipingAll}
            fullWidth
          />
        </View>
      ) : null}

      <View style={screenStyles.syncCard}>
        <Text style={typography.h3}>Cloud sync (Firebase)</Text>
        <Text style={styles.syncLine}>
          Firebase: {firebaseConfigured ? 'Configured' : 'Not configured (local only)'}
        </Text>
        <Text style={styles.syncLine}>Network: {isOnline ? 'Online' : 'Offline'}</Text>
        <Text style={styles.syncLine}>
          Last sync: {lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Never'}
        </Text>
        {lastMessage ? <Text style={styles.syncHint}>{lastMessage}</Text> : null}
        {showSyncButton ? (
          <AppButton
            label="Sync now"
            onPress={handleSync}
            loading={isSyncing}
            fullWidth
          />
        ) : firebaseConfigured && authStatus === 'authenticated' ? (
          <Text style={styles.syncHint}>All local changes are synced.</Text>
        ) : null}
      </View>

      <View style={styles.menuCard}>
        <List.Item
          title="Fine Management"
          description="Track and manage customer fines"
          left={props => <List.Icon {...props} icon="cash-multiple" />}
          onPress={() => navigation.navigate('FinesList')}
        />
        <List.Item
          title="Accident Records"
          description="Damage tracking and blacklist flags"
          left={props => <List.Icon {...props} icon="car-emergency" />}
          onPress={() => navigation.navigate('AccidentsList')}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  lead: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  syncLine: { ...typography.bodySmall, lineHeight: 20 },
  syncHint: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
});
