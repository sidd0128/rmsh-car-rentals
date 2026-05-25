import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import { CarDetailsScreen } from '@features/cars/screens/CarDetailsScreen';
import { CarFormScreen } from '@features/cars/screens/CarFormScreen';
import { CarsListScreen } from '@features/cars/screens/CarsListScreen';
import type { CarsStackParamList } from './types';

const Stack = createNativeStackNavigator<CarsStackParamList>();

export const CarsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen name="CarsList" component={CarsListScreen} options={{ title: 'Fleet' }} />
    <Stack.Screen name="CarDetails" component={CarDetailsScreen} options={{ title: 'Car Details' }} />
    <Stack.Screen
      name="CarForm"
      component={CarFormScreen}
      options={({ route }) => ({
        title: route.params?.carId ? 'Edit Car' : 'Add Car',
      })}
    />
  </Stack.Navigator>
);
