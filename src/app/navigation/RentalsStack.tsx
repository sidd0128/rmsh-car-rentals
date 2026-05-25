import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import { RentalDetailsScreen } from '@features/rentals/screens/RentalDetailsScreen';
import { RentalsListScreen } from '@features/rentals/screens/RentalsListScreen';
import type { RentalsStackParamList } from './types';

const Stack = createNativeStackNavigator<RentalsStackParamList>();

export const RentalsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
    }}
  >
    <Stack.Screen name="RentalsList" component={RentalsListScreen} options={{ title: 'Rentals' }} />
    <Stack.Screen
      name="RentalDetails"
      component={RentalDetailsScreen}
      options={{ title: 'Rental Details' }}
    />
  </Stack.Navigator>
);
