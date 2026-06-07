import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';
import { AppButton } from '@shared/ui';

interface NoInternetScreenProps {
  isRefreshing?: boolean;
  onRefresh: () => void | Promise<void>;
}

export const NoInternetScreen = ({ isRefreshing = false, onRefresh }: NoInternetScreenProps) => {
  const { colors } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    gap: spacing.lg,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
