import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import { AccidentFormScreen } from '@features/accidents/screens/AccidentFormScreen';
import { AccidentsListScreen } from '@features/accidents/screens/AccidentsListScreen';
import { FineFormScreen } from '@features/fines/screens/FineFormScreen';
import { FinesListScreen } from '@features/fines/screens/FinesListScreen';
import { SettingsScreen } from '@features/dashboard/screens/SettingsScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
    }}
  >
    <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'More' }} />
    <Stack.Screen name="FinesList" component={FinesListScreen} options={{ title: 'Fines' }} />
    <Stack.Screen
      name="FineForm"
      component={FineFormScreen}
      options={{ title: 'Add Fine' }}
    />
    <Stack.Screen name="AccidentsList" component={AccidentsListScreen} options={{ title: 'Accidents' }} />
    <Stack.Screen
      name="AccidentForm"
      component={AccidentFormScreen}
      options={{ title: 'Report Accident' }}
    />
  </Stack.Navigator>
);
