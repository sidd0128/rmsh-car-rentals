import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { spacing } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import i18n from '@core/i18n';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { CarsStack } from './CarsStack';
import { CustomersStack } from './CustomersStack';
import { DashboardStack } from './DashboardStack';
import { HistoryStack } from './HistoryStack';
import { SettingsStack } from './SettingsStack';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const dashboardTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="view-dashboard" color={color} size={size} />
);

const carsTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="car" color={color} size={size} />
);

const customersTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="account-group" color={color} size={size} />
);

const historyTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="history" color={color} size={size} />
);

const settingsTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="dots-horizontal" color={color} size={size} />
);

const TabBar = (props: BottomTabBarProps) => {
  const { colors } = useThemeContext();

  return (
  <View
    style={[
      styles.tabBarContainer,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      },
    ]}
  >
    <BottomTabBar {...props} />
  </View>
  );
};

export const BottomTabs = () => {
  const { colors } = useThemeContext();
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
          title: i18n.t('navigation.dashboard'),
          tabBarIcon: dashboardTabIcon,
        }}
      />
      <Tab.Screen
        name="CarsTab"
        component={CarsStack}
        options={{
          title: i18n.t('navigation.cars'),
          tabBarIcon: carsTabIcon,
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersStack}
        options={{
          title: i18n.t('navigation.customers'),
          tabBarIcon: customersTabIcon,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{
          title: i18n.t('navigation.history'),
          tabBarIcon: historyTabIcon,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          title: i18n.t('navigation.more'),
          tabBarIcon: settingsTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
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
