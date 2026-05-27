import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { List, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { colors, radius, spacing, typography } from '@app/theme';
import { showDevDataTools } from '@core/config/env';
import { loadDemoSeedData } from '@core/data/loadDemoSeedData';
import { wipeAllAppData } from '@core/data/wipeAllAppData';
import { formatDateTime } from '@core/helpers/date';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useTranslation } from '@core/i18n';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { performAppLogout } from '@core/storage/performAppLogout';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton } from '@shared/ui';

export const SettingsScreen = () => {
  const { t } = useTranslation();
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
  const [loadingDemo, setLoadingDemo] = useState(false);

  const formatCloudWipeSummary = (
    cloudSkipped: boolean,
    deleted: Partial<Record<string, number>>,
  ): string => {
    if (cloudSkipped) {
      return t('settings.cloudNotCleared');
    }
    const total = Object.values(deleted).reduce<number>(
      (sum, count) => sum + (count ?? 0),
      0,
    );
    return t('settings.cloudCleared', { count: total });
  };

  useFocusEffect(
    useCallback(() => {
      void refreshPendingSync();
    }, [refreshPendingSync]),
  );

  const handleSync = async () => {
    const message = await syncNow();
    await hydrateAll();
    Alert.alert(t('settings.syncAlertTitle'), message);
  };

  const handleLoadDemo = () => {
    Alert.alert(t('settings.loadDemoTitle'), t('settings.loadDemoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.loadDemoConfirm'),
        onPress: () => {
          void (async () => {
            setLoadingDemo(true);
            await loadDemoSeedData();
            await hydrateAll();
            setLoadingDemo(false);
            Alert.alert(t('settings.loadDemoDoneTitle'), t('settings.loadDemoDoneMessage'));
          })();
        },
      },
    ]);
  };

  const handleWipeAllData = () => {
    Alert.alert(t('settings.wipeAllTitle'), t('settings.wipeAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.wipeAllConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setWipingAll(true);
            const result = await wipeAllAppData();
            await hydrateAll();
            await refreshPendingSync();
            setWipingAll(false);
            Alert.alert(
              t('settings.wipeAllDoneTitle'),
              t('settings.wipeAllDoneMessage', {
                cloudSummary: formatCloudWipeSummary(
                  result.cloudSkipped,
                  result.cloudDeletedByCollection,
                ),
              }),
            );
          })();
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(t('settings.signOutTitle'), t('settings.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: () => {
          void performAppLogout();
        },
      },
    ]);
  };

  return (
    <ScreenLayout onRefresh={handleSync} refreshing={isSyncing}>
      <Text style={typography.h2}>{t('settings.title')}</Text>
      <Text style={styles.lead}>{t('settings.lead')}</Text>

      <View style={screenStyles.syncCard}>
        <Text style={typography.h3}>{t('settings.account')}</Text>
        {authUser?.email ? (
          <Text style={styles.syncLine}>
            {t('settings.signedInAs', { email: authUser.email })}
          </Text>
        ) : null}
        <AppButton
          label={t('settings.signOut')}
          variant="outline"
          onPress={handleSignOut}
          fullWidth
        />
      </View>

      {showDevDataTools() ? (
        <View style={screenStyles.syncCard}>
          <Text style={typography.h3}>{t('settings.devDataTitle')}</Text>
          <Text style={styles.syncHint}>{t('settings.devDataHint')}</Text>
          <View style={styles.devActions}>
            <AppButton
              label={t('settings.loadDemo')}
              variant="outline"
              onPress={handleLoadDemo}
              loading={loadingDemo}
              fullWidth
            />
            <AppButton
              label={t('settings.wipeAllData')}
              variant="danger"
              onPress={handleWipeAllData}
              loading={wipingAll}
              fullWidth
            />
          </View>
        </View>
      ) : null}

      <View style={screenStyles.syncCard}>
        <Text style={typography.h3}>{t('settings.cloudSyncTitle')}</Text>
        <Text style={styles.syncLine}>
          {firebaseConfigured
            ? t('settings.firebaseConfigured')
            : t('settings.firebaseNotConfigured')}
        </Text>
        <Text style={styles.syncLine}>
          {isOnline ? t('settings.networkOnline') : t('settings.networkOffline')}
        </Text>
        <Text style={styles.syncLine}>
          {lastSyncedAt
            ? t('settings.lastSync', { time: formatDateTime(lastSyncedAt) })
            : t('settings.lastSyncNever')}
        </Text>
        {lastMessage ? <Text style={styles.syncHint}>{lastMessage}</Text> : null}
        {showSyncButton ? (
          <AppButton
            label={t('settings.syncNow')}
            onPress={handleSync}
            loading={isSyncing}
            fullWidth
          />
        ) : firebaseConfigured && authStatus === 'authenticated' ? (
          <Text style={styles.syncHint}>{t('settings.allSynced')}</Text>
        ) : null}
      </View>

      <View style={styles.menuCard}>
        <List.Item
          title={t('settings.fineManagement')}
          description={t('settings.fineManagementDesc')}
          left={props => <List.Icon {...props} icon="cash-multiple" />}
          onPress={() => navigation.navigate('FinesList')}
        />
        <List.Item
          title={t('settings.accidentRecords')}
          description={t('settings.accidentRecordsDesc')}
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
  devActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
});
