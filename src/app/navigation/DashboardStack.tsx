import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import i18n from '@core/i18n';
import { BookingRequestsScreen } from '@features/bookingRequests/screens/BookingRequestsScreen';
import { DashboardScreen } from '@features/dashboard/screens/DashboardScreen';
import { EarningsBreakdownScreen } from '@features/dashboard/screens/EarningsBreakdownScreen';
import { UpcomingEarningsScreen } from '@features/dashboard/screens/UpcomingEarningsScreen';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export const DashboardStack = () => {
  const { colors } = useThemeContext();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerShown: false,
      }}
    >
    <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    <Stack.Screen
      name="EarningsBreakdown"
      component={EarningsBreakdownScreen}
      options={{
        headerShown: true,
        title: i18n.t('navigation.earningsBreakdown'),
        headerBackTitle: i18n.t('navigation.dashboard'),
      }}
    />
    <Stack.Screen
      name="BookingRequests"
      component={BookingRequestsScreen}
      options={{
        headerShown: true,
        title: i18n.t('navigation.bookingRequests'),
        headerBackTitle: i18n.t('navigation.dashboard'),
      }}
    />
    <Stack.Screen
      name="UpcomingEarnings"
      component={UpcomingEarningsScreen}
      options={{
        headerShown: true,
        title: i18n.t('navigation.upcomingEarningsThisYear'),
        headerBackTitle: i18n.t('navigation.dashboard'),
      }}
    />
    </Stack.Navigator>
  );
};
