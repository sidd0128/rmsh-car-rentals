import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import i18n from '@core/i18n';
import { AccidentDetailsScreen } from '@features/accidents/screens/AccidentDetailsScreen';
import { AccidentFormScreen } from '@features/accidents/screens/AccidentFormScreen';
import { AccidentsListScreen } from '@features/accidents/screens/AccidentsListScreen';
import { FineDetailsScreen } from '@features/fines/screens/FineDetailsScreen';
import { FineFormScreen } from '@features/fines/screens/FineFormScreen';
import { FinesListScreen } from '@features/fines/screens/FinesListScreen';
import { SettingsScreen } from '@features/dashboard/screens/SettingsScreen';
import { DeletionAuditLogsScreen } from '@features/security/screens/DeletionAuditLogsScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => {
  const { colors } = useThemeContext();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: i18n.t('navigation.more') }}
      />
      <Stack.Screen
        name="FinesList"
        component={FinesListScreen}
        options={{ title: i18n.t('navigation.fines') }}
      />
      <Stack.Screen
        name="FineDetails"
        component={FineDetailsScreen}
        options={{ title: i18n.t('navigation.fineDetails') }}
      />
      <Stack.Screen
        name="FineForm"
        component={FineFormScreen}
        options={({ route }) => ({
          title: route.params?.fineId
            ? i18n.t('navigation.editFine')
            : i18n.t('navigation.addFine'),
        })}
      />
      <Stack.Screen
        name="AccidentsList"
        component={AccidentsListScreen}
        options={{ title: i18n.t('navigation.accidents') }}
      />
      <Stack.Screen
        name="AccidentDetails"
        component={AccidentDetailsScreen}
        options={{ title: i18n.t('navigation.accidentReport') }}
      />
      <Stack.Screen
        name="AccidentForm"
        component={AccidentFormScreen}
        options={{ title: i18n.t('navigation.reportAccident') }}
      />
      <Stack.Screen
        name="DeletionAuditLogs"
        component={DeletionAuditLogsScreen}
        options={{ title: 'Deletion audit log' }}
      />
    </Stack.Navigator>
  );
};
