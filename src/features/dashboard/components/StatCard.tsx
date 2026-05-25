import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, shadows, radius, spacing, typography } from '@app/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
}

export const StatCard = memo<StatCardProps>(({ label, value, accent = colors.primary }) => (
  <View style={[styles.card, shadows.sm]}>
    <Text style={[styles.value, { color: accent }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
));

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  value: { ...typography.h2, marginBottom: spacing.xs },
  label: { ...typography.bodySmall },
});
