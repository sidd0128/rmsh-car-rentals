import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '@app/theme';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { CarsStack } from './CarsStack';
import { CustomersStack } from './CustomersStack';
import { DashboardStack } from './DashboardStack';
import { RentalsStack } from './RentalsStack';
import { SettingsStack } from './SettingsStack';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabBar = (props: BottomTabBarProps) => (
  <View style={styles.tabBarContainer}>
    <BottomTabBar {...props} />
  </View>
);

export const BottomTabs = () => {
  const { isTablet } = useDeviceLayout();

  return (
    <Tab.Navigator
      tabBar={TabBar}
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        ...(isTablet ? { tabBarLabelPosition: 'below-icon' as const } : null),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          ...(isTablet ? { height: 72, paddingBottom: spacing.sm } : null),
        },
        sceneStyle: { backgroundColor: colors.background },
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
          tabBarIcon: ({ color, size }) => (
            <Icon name="dots-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        zIndex: 1000,
      },
      android: {
        elevation: 24,
      },
    }),
  },
});
