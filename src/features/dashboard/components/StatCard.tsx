import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { shadows, radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
  description?: string;
  onPress?: () => void;
}

export const StatCard = memo<StatCardProps>(
  ({ label, value, accent, description, onPress }) => {
  const { colors } = useThemeContext();
  const accentColor = accent ?? colors.primary;
  const content = (
    <>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={3}>
        {label}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={4}>
          {description}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.card, shadows.sm, { backgroundColor: colors.surface }]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadows.sm,
        { backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
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
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  value: { ...typography.h2, marginBottom: spacing.xs },
  label: { ...typography.bodySmall },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.85 },
});
