import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import i18n from '@core/i18n';
import { BookingRequestsScreen } from '@features/bookingRequests/screens/BookingRequestsScreen';
import { DashboardScreen } from '@features/dashboard/screens/DashboardScreen';
import { RentDueScreen } from '@features/rentDue/screens/RentDueScreen';
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
        name="BookingRequests"
        component={BookingRequestsScreen}
        options={{
          headerShown: true,
          title: i18n.t('navigation.bookingRequests'),
          headerBackTitle: i18n.t('navigation.dashboard'),
        }}
      />
      <Stack.Screen
        name="RentDue"
        component={RentDueScreen}
        options={{
          headerShown: true,
          title: i18n.t('navigation.rentDue'),
          headerBackTitle: i18n.t('navigation.dashboard'),
        }}
      />
    </Stack.Navigator>
  );
};
