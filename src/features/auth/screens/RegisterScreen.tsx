import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { AuthStackParamList } from '@app/navigation/types';
import { registerWithEmail } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirebaseAuthErrorMessage } from '@core/firebase/auth/utils/firebaseAuthErrorUtils';
import { spacing } from '@app/theme';
import { AppButton, AppInput } from '@shared/ui';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
export const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const onRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm password must match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }

    try {
      await registerWithEmail(email, password);
    } catch (error) {
      Alert.alert('Registration failed', getFirebaseAuthErrorMessage(error));
    }
  };

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Set up your email and password. You will be signed in automatically."
      showBack
      onBackPress={() => navigation.goBack()}
    >
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        leftIcon="email-outline"
        placeholder="you@company.com"
        containerStyle={styles.field}
      />
      <AppInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        enablePasswordToggle
        autoCapitalize="none"
        autoComplete="password"
        leftIcon="lock-outline"
        placeholder="At least 6 characters"
        containerStyle={styles.field}
      />
      <AppInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        enablePasswordToggle
        autoCapitalize="none"
        leftIcon="lock-check-outline"
        placeholder="Re-enter password"
        containerStyle={styles.fieldLast}
      />

      <View style={styles.actions}>
        <AppButton
          label="Create account"
          onPress={onRegister}
          fullWidth
        />
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: spacing.sm },
  fieldLast: { marginBottom: 0 },
  actions: {
    marginTop: spacing.lg,
  },
});
