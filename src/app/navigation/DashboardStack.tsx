import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import { DashboardScreen } from '@features/dashboard/screens/DashboardScreen';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export const DashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
      headerShown: false,
    }}
  >
    <Stack.Screen name="DashboardHome" component={DashboardScreen} />
  </Stack.Navigator>
);
