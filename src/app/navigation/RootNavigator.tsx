import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthStack } from './AuthStack';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  showMainApp: boolean;
}

export const RootNavigator = ({ showMainApp }: RootNavigatorProps) => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: styles.stackContent,
      }}
    >
      {showMainApp ? (
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  stackContent: { flex: 1 },
});
