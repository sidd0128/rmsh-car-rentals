import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@app/theme';

interface ErrorFallbackScreenProps {
  onRetry: () => void;
}

export const ErrorFallbackScreen = ({ onRetry }: ErrorFallbackScreenProps) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong.
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Please refresh the app and try again.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onRetry}
      >
        <Text style={[styles.buttonText, { color: colors.textInverse }]}>
          Try again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    ...typography.button,
  },
});
