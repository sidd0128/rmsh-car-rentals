import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import { AccidentDetailsScreen } from '@features/accidents/screens/AccidentDetailsScreen';
import { CustomerFormScreen } from '@features/customers/screens/CustomerFormScreen';
import { CustomerProfileScreen } from '@features/customers/screens/CustomerProfileScreen';
import { CustomersListScreen } from '@features/customers/screens/CustomersListScreen';
import { FineDetailsScreen } from '@features/fines/screens/FineDetailsScreen';
import { FineFormScreen } from '@features/fines/screens/FineFormScreen';
import type { CustomersStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export const CustomersStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
    }}
  >
    <Stack.Screen
      name="CustomersList"
      component={CustomersListScreen}
      options={{ title: 'Customers' }}
    />
    <Stack.Screen
      name="CustomerProfile"
      component={CustomerProfileScreen}
      options={{ title: 'Customer Profile' }}
    />
    <Stack.Screen
      name="CustomerForm"
      component={CustomerFormScreen}
      options={({ route }) => ({
        title: route.params?.customerId ? 'Edit Customer' : 'Add Customer',
      })}
    />
    <Stack.Screen
      name="FineDetails"
      component={FineDetailsScreen}
      options={{ title: 'Fine details' }}
    />
    <Stack.Screen
      name="FineForm"
      component={FineFormScreen}
      options={({ route }) => ({
        title: route.params?.fineId ? 'Edit fine' : 'Add fine',
      })}
    />
    <Stack.Screen
      name="AccidentDetails"
      component={AccidentDetailsScreen}
      options={{ title: 'Accident report' }}
    />
  </Stack.Navigator>
);
