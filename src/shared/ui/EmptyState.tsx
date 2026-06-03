import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing } from '@app/theme/spacing';
import { typography } from '@app/theme/typography';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = memo<EmptyStateProps>(
  ({ title, description, actionLabel, onAction }) => (
    <View style={styles.container}>
      <Text style={typography.h3}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  ),
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  desc: { ...typography.bodySmall, marginTop: spacing.sm, textAlign: 'center' },
  btn: { marginTop: spacing.lg },
});
