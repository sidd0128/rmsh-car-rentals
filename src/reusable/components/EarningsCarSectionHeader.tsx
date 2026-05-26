import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing, typography } from '@app/theme';
import { formatCurrency } from '@core/utils/currency';

const hireLabel = (count: number): string =>
  count === 1 ? '1 customer hire' : `${count} customer hires`;

export interface EarningsCarSectionHeaderProps {
  carName: string;
  hireCount: number;
  totalPaid: number;
  totalPending: number;
  expanded: boolean;
  onPress: () => void;
}

export const EarningsCarSectionHeader = memo<EarningsCarSectionHeaderProps>(
  ({ carName, hireCount, totalPaid, totalPending, expanded, onPress }) => {
    const summaryParts = [hireLabel(hireCount), `${formatCurrency(totalPaid)} received`];
    if (totalPending > 0) {
      summaryParts.push(`${formatCurrency(totalPending)} pending`);
    }

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.textCol}>
          <Text style={styles.title}>{carName}</Text>
          <Text style={styles.summary}>{summaryParts.join(' · ')}</Text>
        </View>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  textCol: { flex: 1, paddingRight: spacing.sm },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  summary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
