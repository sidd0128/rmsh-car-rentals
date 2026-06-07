import { RENT_DUE_WEEKDAY_OPTIONS } from '@core/services/rentalBillingService';
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { radius, spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

interface WeekdayPickerProps {
  value: number;
  onChange: (weekday: number) => void;
}

export const WeekdayPicker = memo<WeekdayPickerProps>(({ value, onChange }) => {
  const { colors } = useThemeContext();

  return (
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
            style={[
              styles.chip,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.infoBg : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: selected ? colors.primary : colors.textSecondary },
                selected && styles.chipLabelSelected,
              ]}
            >
              {day.shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

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
    alignItems: 'center',
  },
  chipLabel: {
    ...typography.label,
    textAlign: 'center',
  },
  chipLabelSelected: {
    ...typography.label,
    fontWeight: '600',
    textAlign: 'center',
  },
});
