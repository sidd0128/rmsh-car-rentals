import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import i18n from '@core/i18n';
import { HistoryCarsListScreen } from '@features/history/screens/HistoryCarsListScreen';
import { CarRentalHistoryScreen } from '@features/history/screens/CarRentalHistoryScreen';
import type { HistoryStackParamList } from './types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export const HistoryStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
    }}
  >
    <Stack.Screen
      name="HistoryCarsList"
      component={HistoryCarsListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CarRentalHistory"
      component={CarRentalHistoryScreen}
      options={{
        title: i18n.t('history.carRentalHistory'),
        headerBackTitle: i18n.t('navigation.history'),
      }}
    />
  </Stack.Navigator>
);
