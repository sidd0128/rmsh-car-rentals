import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import i18n from '@core/i18n';
import { AccidentDetailsScreen } from '@features/accidents/screens/AccidentDetailsScreen';
import { CarDetailsScreen } from '@features/cars/screens/CarDetailsScreen';
import { CarFormScreen } from '@features/cars/screens/CarFormScreen';
import { CarsListScreen } from '@features/cars/screens/CarsListScreen';
import { FineDetailsScreen } from '@features/fines/screens/FineDetailsScreen';
import type { CarsStackParamList } from './types';

const Stack = createNativeStackNavigator<CarsStackParamList>();

export const CarsStack = () => {
  const { colors } = useThemeContext();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
    <Stack.Screen
      name="CarsList"
      component={CarsListScreen}
      options={{ title: i18n.t('navigation.fleet') }}
    />
    <Stack.Screen
      name="CarDetails"
      component={CarDetailsScreen}
      options={{ title: i18n.t('navigation.carDetails') }}
    />
    <Stack.Screen
      name="CarForm"
      component={CarFormScreen}
      options={({ route }) => ({
        title: route.params?.carId
          ? i18n.t('navigation.editCar')
          : i18n.t('navigation.addCar'),
      })}
    />
    <Stack.Screen
      name="FineDetails"
      component={FineDetailsScreen}
      options={{ title: i18n.t('navigation.fineDetails') }}
    />
    <Stack.Screen
      name="AccidentDetails"
      component={AccidentDetailsScreen}
      options={{ title: i18n.t('navigation.accidentReport') }}
    />
    </Stack.Navigator>
  );
};
