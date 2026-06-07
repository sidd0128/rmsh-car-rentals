import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';
import { useThemeContext } from '@contextApis/theme/useThemeContext';

interface ReadOnlyFormFieldProps {
  label: string;
  value: string;
  meta?: string;
}

/** Non-editable form row (e.g. car resolved from selected customer). */
export const ReadOnlyFormField = memo<ReadOnlyFormFieldProps>(({ label, value, meta }) => {
  const { colors } = useThemeContext();

  return (
    <View style={styles.field}>
      <Text style={[typography.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        {meta ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{meta}</Text> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  box: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  value: { ...typography.body },
  meta: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
});
