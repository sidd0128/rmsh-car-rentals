import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@app/theme';

interface ErrorFallbackScreenProps {
  onRetry: () => void;
}

export const ErrorFallbackScreen = ({ onRetry }: ErrorFallbackScreenProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Something went wrong.</Text>
    <Text style={styles.message}>Please refresh the app and try again.</Text>
    <TouchableOpacity style={styles.button} onPress={onRetry}>
      <Text style={styles.buttonText}>Try again</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
