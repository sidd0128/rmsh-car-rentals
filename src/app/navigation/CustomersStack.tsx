import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '@app/theme';
import i18n from '@core/i18n';
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
      options={{ title: i18n.t('navigation.customers') }}
    />
    <Stack.Screen
      name="CustomerProfile"
      component={CustomerProfileScreen}
      options={{ title: i18n.t('navigation.customerProfile') }}
    />
    <Stack.Screen
      name="CustomerForm"
      component={CustomerFormScreen}
      options={({ route }) => ({
        title: route.params?.customerId
          ? i18n.t('navigation.editCustomer')
          : i18n.t('navigation.addCustomer'),
      })}
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
      name="AccidentDetails"
      component={AccidentDetailsScreen}
      options={{ title: i18n.t('navigation.accidentReport') }}
    />
  </Stack.Navigator>
);
