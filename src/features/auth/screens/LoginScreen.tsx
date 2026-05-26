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
import { useTranslation } from '@core/i18n';
import { AppButton, AppInput } from '@shared/ui';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { useFirebaseAuthStore } from '../store/useFirebaseAuthStore';

export const LoginScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const sessionExpiredMessage = useFirebaseAuthStore(s => s.sessionExpiredMessage);
  const clearSessionExpiredMessage = useFirebaseAuthStore(s => s.clearSessionExpiredMessage);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLocked, setFormLocked] = useState(false);

  const onLogin = async () => {
    if (!isFirebaseConfigured()) {
      Alert.alert(
        t('auth.firebaseNotConfiguredTitle'),
        t('auth.firebaseNotConfiguredMessage'),
      );
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert(t('auth.missingFieldsTitle'), t('auth.missingEmailPassword'));
      return;
    }

    clearSessionExpiredMessage();

    try {
      await signInWithEmail(email, password);
    } catch (error) {
      Alert.alert(t('auth.signInFailedTitle'), getFirebaseAuthErrorMessage(error));
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      banner={
        sessionExpiredMessage ? (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredText}>{sessionExpiredMessage}</Text>
          </View>
        ) : null
      }
      footer={
        <Text style={styles.footerNote}>{t('auth.dataStaysOnDevice')}</Text>
      }
    >
      <AppInput
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        leftIcon="email-outline"
        placeholder={t('auth.emailPlaceholder')}
        containerStyle={styles.field}
      />
      <AppInput
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        enablePasswordToggle
        autoCapitalize="none"
        autoComplete="password"
        leftIcon="lock-outline"
        placeholder={t('auth.passwordPlaceholder')}
        containerStyle={styles.fieldLast}
      />

      <View style={styles.actions}>
        <AppButton
          label={t('auth.signIn')}
          onPress={onLogin}
          onBusyChange={setFormLocked}
          fullWidth
        />
        <AppButton
          label={t('auth.createAccount')}
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
