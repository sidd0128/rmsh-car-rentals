import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { useFirebaseAuthStore } from '@features/auth/store/useFirebaseAuthStore';
import { AuthStack } from './AuthStack';
import { BottomTabs } from './BottomTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Switches between Auth stack and main tabs based on Firebase auth state.
 * Initial loading is handled in `AppProvider` (auth restore + data hydrate).
 */
export const RootNavigator = () => {
  const status = useFirebaseAuthStore(s => s.status);
  const firebaseConfigured = isFirebaseConfigured();
  const showMainApp = !firebaseConfigured || status === 'authenticated';

  return (
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
};

const styles = StyleSheet.create({
  stackContent: { flex: 1 },
});
