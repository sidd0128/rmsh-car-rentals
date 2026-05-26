import { RENT_DUE_WEEKDAY_OPTIONS } from '@core/services/rentalBillingService';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, radius, spacing, typography } from '@app/theme';

interface WeekdayPickerProps {
  value: number;
  onChange: (weekday: number) => void;
}

export const WeekdayPicker = memo<WeekdayPickerProps>(({ value, onChange }) => (
  <View style={styles.row}>
    {RENT_DUE_WEEKDAY_OPTIONS.map(day => {
      const selected = value === day.value;
      return (
        <Pressable
          key={day.value}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={day.label}
          onPress={() => onChange(day.value)}
          style={[styles.chip, selected && styles.chipSelected]}
        >
          <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{day.shortLabel}</Text>
        </Pressable>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoBg,
  },
  chipLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chipLabelSelected: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
