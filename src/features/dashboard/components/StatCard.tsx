import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, shadows, radius, spacing, typography } from '@app/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
  description?: string;
  onPress?: () => void;
}

export const StatCard = memo<StatCardProps>(
  ({ label, value, accent = colors.primary, description, onPress }) => {
  const content = (
    <>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={3}>
        {label}
      </Text>
      {description ? (
        <Text style={styles.description} numberOfLines={4}>
          {description}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, shadows.sm]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadows.sm, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={description ? `${label}. ${description}` : label}
    >
      {content}
    </Pressable>
  );
  },
);

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
  description: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.85 },
});
