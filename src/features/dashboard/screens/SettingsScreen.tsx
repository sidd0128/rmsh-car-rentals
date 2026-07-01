import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import type { SettingsStackParamList } from '@app/navigation/types';
import { radius, spacing, typography } from '@app/theme';
import { useLanguage } from '@contextApis/language/useLanguage';
import type { AppLanguage } from '@contextApis/language/LanguageContext';
import type { ThemeMode } from '@contextApis/theme/ThemeContext';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { showDevDataTools } from '@core/config/env';
import { loadDemoSeedData } from '@core/data/loadDemoSeedData';
import { wipeAllAppData } from '@core/data/wipeAllAppData';
import { formatDateTime } from '@core/helpers/date';
import { useHydrateStores } from '@core/hooks/useHydrateStores';
import { useTranslation } from '@core/i18n';
import { pushNotificationService } from '@core/notifications/pushNotificationService';
import { useCloudSyncStore } from '@core/store/useCloudSyncStore';
import { performAppLogout } from '@core/storage/performAppLogout';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { useAppSettingsStore } from '@features/dashboard/store/useAppSettingsStore';
import { ScreenLayout } from '@shared/layouts/ScreenLayout';
import { screenStyles } from '@shared/layouts/screenStyles';
import { AppButton } from '@shared/ui';

type ListIconProps = Omit<React.ComponentProps<typeof List.Icon>, 'icon'>;

const fineManagementIcon = (props: ListIconProps) => (
  <List.Icon {...props} icon="cash-multiple" />
);

const accidentRecordsIcon = (props: ListIconProps) => (
  <List.Icon {...props} icon="car-emergency" />
);

export const SettingsScreen = () => {
  const { t } = useTranslation();
  const { language, options: languageOptions, setLanguage } = useLanguage();
  const { colors, mode, setMode } = useThemeContext();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
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
  const appSettings = useAppSettingsStore(s => s.settings);
  const settingsSaving = useAppSettingsStore(s => s.saving);
  const setAutoAcceptNewBookingRequests = useAppSettingsStore(
    s => s.setAutoAcceptNewBookingRequests,
  );
  const showSyncButton =
    firebaseConfigured && authStatus === 'authenticated' && hasPendingSync;
  const [wipingAll, setWipingAll] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);
  const [savingPushPreference, setSavingPushPreference] = useState(false);

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
      refreshPendingSync().catch(() => undefined);
      pushNotificationService
        .isEnabled()
        .then(setPushNotificationsEnabled)
        .catch(() => undefined);
    }, [refreshPendingSync]),
  );

  const handleSync = async () => {
    const message = await syncNow();
    await hydrateAll();
    Alert.alert(t('settings.syncAlertTitle'), message);
  };

  const confirmLoadDemo = async () => {
    setLoadingDemo(true);
    await loadDemoSeedData();
    await hydrateAll();
    setLoadingDemo(false);
    Alert.alert(
      t('settings.loadDemoDoneTitle'),
      t('settings.loadDemoDoneMessage'),
    );
  };

  const handleLoadDemo = () => {
    Alert.alert(t('settings.loadDemoTitle'), t('settings.loadDemoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.loadDemoConfirm'),
        onPress: () => {
          confirmLoadDemo().catch(() => setLoadingDemo(false));
        },
      },
    ]);
  };

  const confirmWipeAllData = async () => {
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
  };

  const handleWipeAllData = () => {
    Alert.alert(t('settings.wipeAllTitle'), t('settings.wipeAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.wipeAllConfirm'),
        style: 'destructive',
        onPress: () => {
          confirmWipeAllData().catch(() => setWipingAll(false));
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
          performAppLogout().catch(() => undefined);
        },
      },
    ]);
  };

  const handleAutoAcceptToggle = (enabled: boolean) => {
    setAutoAcceptNewBookingRequests(enabled).catch(error => {
      Alert.alert(
        t('settings.bookingRequestsSettingFailedTitle'),
        error instanceof Error ? error.message : t('auth.errors.generic'),
      );
    });
  };

  const handlePushNotificationToggle = (enabled: boolean) => {
    setSavingPushPreference(true);
    pushNotificationService
      .setEnabled(enabled)
      .then(() => {
        setPushNotificationsEnabled(enabled);
      })
      .catch(error => {
        Alert.alert(
          t('settings.pushNotificationsFailedTitle'),
          error instanceof Error ? error.message : t('auth.errors.generic'),
        );
      })
      .finally(() => setSavingPushPreference(false));
  };

  return (
    <ScreenLayout onRefresh={handleSync} refreshing={isSyncing}>
      <Text style={typography.h2}>{t('settings.title')}</Text>
      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        {t('settings.lead')}
      </Text>

      <View
        style={[
          screenStyles.syncCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Text style={typography.h3}>{t('settings.preferences')}</Text>
        <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>
          {t('settings.theme')}
        </Text>
        <SegmentedButtons
          value={mode}
          onValueChange={value => setMode(value as ThemeMode)}
          buttons={[
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
        <Text style={[styles.preferenceLabel, { color: colors.textSecondary }]}>
          {t('settings.language')}
        </Text>
        <SegmentedButtons
          value={language}
          onValueChange={value => setLanguage(value as AppLanguage)}
          buttons={languageOptions.map(option => ({
            value: option.value,
            label: option.label,
          }))}
        />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={typography.h4}>
              {t('settings.autoAcceptBookingRequests')}
            </Text>
            <Text style={[styles.syncHint, { color: colors.textMuted }]}>
              {t('settings.autoAcceptBookingRequestsDesc')}
            </Text>
          </View>
          <Switch
            value={appSettings?.autoAcceptNewBookingRequests === true}
            onValueChange={handleAutoAcceptToggle}
            disabled={settingsSaving}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={typography.h4}>
              {t('settings.bookingPushNotifications')}
            </Text>
            <Text style={[styles.syncHint, { color: colors.textMuted }]}>
              {t('settings.bookingPushNotificationsDesc')}
            </Text>
          </View>
          <Switch
            value={pushNotificationsEnabled}
            onValueChange={handlePushNotificationToggle}
            disabled={
              savingPushPreference ||
              !firebaseConfigured ||
              authStatus !== 'authenticated'
            }
          />
        </View>
      </View>

      <View
        style={[
          screenStyles.syncCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
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
        <View
          style={[
            screenStyles.syncCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Text style={typography.h3}>{t('settings.devDataTitle')}</Text>
          <Text style={[styles.syncHint, { color: colors.textMuted }]}>
            {t('settings.devDataHint')}
          </Text>
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

      <View
        style={[
          screenStyles.syncCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Text style={typography.h3}>{t('settings.cloudSyncTitle')}</Text>
        <Text style={styles.syncLine}>
          {firebaseConfigured
            ? t('settings.firebaseConfigured')
            : t('settings.firebaseNotConfigured')}
        </Text>
        <Text style={styles.syncLine}>
          {isOnline
            ? t('settings.networkOnline')
            : t('settings.networkOffline')}
        </Text>
        <Text style={styles.syncLine}>
          {lastSyncedAt
            ? t('settings.lastSync', { time: formatDateTime(lastSyncedAt) })
            : t('settings.lastSyncNever')}
        </Text>
        {lastMessage ? (
          <Text style={[styles.syncHint, { color: colors.textMuted }]}>
            {lastMessage}
          </Text>
        ) : null}
        {showSyncButton ? (
          <AppButton
            label={t('settings.syncNow')}
            onPress={handleSync}
            loading={isSyncing}
            fullWidth
          />
        ) : firebaseConfigured && authStatus === 'authenticated' ? (
          <Text style={[styles.syncHint, { color: colors.textMuted }]}>
            {t('settings.allSynced')}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.menuCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <List.Item
          title={t('settings.fineManagement')}
          description={t('settings.fineManagementDesc')}
          left={fineManagementIcon}
          onPress={() => navigation.navigate('FinesList')}
        />
        <List.Item
          title={t('settings.accidentRecords')}
          description={t('settings.accidentRecordsDesc')}
          left={accidentRecordsIcon}
          onPress={() => navigation.navigate('AccidentsList')}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  lead: {
    ...typography.bodySmall,
    marginTop: -spacing.sm,
  },
  syncLine: { ...typography.bodySmall, lineHeight: 20 },
  syncHint: { ...typography.caption, lineHeight: 18 },
  preferenceLabel: {
    ...typography.label,
  },
  devActions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  switchCopy: {
    flex: 1,
  },
  menuCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
