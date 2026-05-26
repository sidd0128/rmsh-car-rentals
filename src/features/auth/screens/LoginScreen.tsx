import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { AuthStackParamList } from '@app/navigation/types';
import { isFirebaseConfigured } from '@core/firebase/config/firebaseAppConfig';
import { signInWithEmail } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirebaseAuthErrorMessage } from '@core/firebase/auth/utils/firebaseAuthErrorUtils';
import { colors, radius, spacing, typography } from '@app/theme';
import { AppButton, AppInput } from '@shared/ui';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { useFirebaseAuthStore } from '../store/useFirebaseAuthStore';

export const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const sessionExpiredMessage = useFirebaseAuthStore(s => s.sessionExpiredMessage);
  const clearSessionExpiredMessage = useFirebaseAuthStore(s => s.clearSessionExpiredMessage);
  const setAuthError = useFirebaseAuthStore(s => s.setAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLocked, setFormLocked] = useState(false);

  const onLogin = async () => {
    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Firebase not configured',
        'Add your Firebase keys to the .env file (see .env.example)',
      );
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }

    setAuthError(null);
    clearSessionExpiredMessage();

    try {
      await signInWithEmail(email, password);
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      setAuthError(message);
      Alert.alert('Sign in failed', message);
    }
  };

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to sync your fleet data across devices."
      banner={
        sessionExpiredMessage ? (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>{sessionExpiredMessage}</Text>
          </View>
        ) : null
      }
      footer={
        <Text style={styles.footerNote}>
          Your data stays on this device and syncs when you are signed in.
        </Text>
      }
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
        placeholder="Your password"
        containerStyle={styles.fieldLast}
      />

      <View style={styles.actions}>
        <AppButton
          label="Sign in"
          onPress={onLogin}
          onBusyChange={setFormLocked}
          fullWidth
        />
        <AppButton
          label="Create account"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
          disabled={formLocked}
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
    gap: spacing.md,
  },
  expiredBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  expiredText: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 20,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
