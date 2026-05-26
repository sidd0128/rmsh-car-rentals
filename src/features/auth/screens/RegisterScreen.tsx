import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { AuthStackParamList } from '@app/navigation/types';
import { registerWithEmail } from '@core/firebase/auth/services/firebaseAuthService';
import { getFirebaseAuthErrorMessage } from '@core/firebase/auth/utils/firebaseAuthErrorUtils';
import { spacing } from '@app/theme';
import { useTranslation } from '@core/i18n';
import { AppButton, AppInput } from '@shared/ui';
import { AuthScreenLayout } from '../components/AuthScreenLayout';

export const RegisterScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const onRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('auth.missingFieldsTitle'), t('auth.missingEmailPasswordRegister'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.passwordsMismatchTitle'), t('auth.passwordsMismatchMessage'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('auth.weakPasswordTitle'), t('auth.weakPasswordMessage'));
      return;
    }

    try {
      await registerWithEmail(email, password);
    } catch (error) {
      Alert.alert(t('auth.registrationFailedTitle'), getFirebaseAuthErrorMessage(error));
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.createAccountTitle')}
      subtitle={t('auth.createAccountSubtitle')}
      showBack
      onBackPress={() => navigation.goBack()}
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
        placeholder={t('auth.passwordMinPlaceholder')}
        containerStyle={styles.field}
      />
      <AppInput
        label={t('auth.confirmPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        enablePasswordToggle
        autoCapitalize="none"
        leftIcon="lock-check-outline"
        placeholder={t('auth.confirmPasswordPlaceholder')}
        containerStyle={styles.fieldLast}
      />

      <View style={styles.actions}>
        <AppButton label={t('auth.createAccount')} onPress={onRegister} fullWidth />
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
