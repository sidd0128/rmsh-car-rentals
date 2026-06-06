import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '@app/theme';
import { AppButton } from '@shared/ui';

interface NoInternetScreenProps {
  isRefreshing?: boolean;
  onRefresh: () => void | Promise<void>;
}

export const NoInternetScreen = ({ isRefreshing = false, onRefresh }: NoInternetScreenProps) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>Seems your internet is not working.</Text>
      <View style={styles.actions}>
        <AppButton label="Refresh" onPress={onRefresh} loading={isRefreshing} fullWidth />
        <AppButton
          label="Open Settings"
          variant="outline"
          onPress={() => Linking.openSettings()}
          fullWidth
        />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
