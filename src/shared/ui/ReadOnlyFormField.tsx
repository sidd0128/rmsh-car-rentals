import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '@app/theme';

interface ReadOnlyFormFieldProps {
  label: string;
  value: string;
  meta?: string;
}

/** Non-editable form row (e.g. car resolved from selected customer). */
export const ReadOnlyFormField = memo<ReadOnlyFormFieldProps>(({ label, value, meta }) => (
  <View style={styles.field}>
    <Text style={typography.label}>{label}</Text>
    <View style={styles.box}>
      <Text style={styles.value}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  </View>
));

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  value: { ...typography.body, color: colors.text },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
