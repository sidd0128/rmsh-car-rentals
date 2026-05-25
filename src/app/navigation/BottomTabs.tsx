import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '@app/theme';
import { CarsStack } from './CarsStack';
import { CustomersStack } from './CustomersStack';
import { DashboardStack } from './DashboardStack';
import { RentalsStack } from './RentalsStack';
import { SettingsStack } from './SettingsStack';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
    }}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardStack}
      options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => (
          <Icon name="view-dashboard" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="CarsTab"
      component={CarsStack}
      options={{
        title: 'Cars',
        tabBarIcon: ({ color, size }) => <Icon name="car" color={color} size={size} />,
      }}
    />
    <Tab.Screen
      name="CustomersTab"
      component={CustomersStack}
      options={{
        title: 'Customers',
        tabBarIcon: ({ color, size }) => (
          <Icon name="account-group" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="RentalsTab"
      component={RentalsStack}
      options={{
        title: 'Rentals',
        tabBarIcon: ({ color, size }) => (
          <Icon name="calendar-clock" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsStack}
      options={{
        title: 'More',
        tabBarIcon: ({ color, size }) => <Icon name="dots-horizontal" color={color} size={size} />,
      }}
    />
  </Tab.Navigator>
);
