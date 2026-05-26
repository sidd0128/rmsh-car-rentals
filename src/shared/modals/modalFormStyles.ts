import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@app/theme';

export const modalFormStyles = StyleSheet.create({
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  fieldLabel: {
    ...typography.label,
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  switchText: {
    flex: 1,
    gap: spacing.xxs,
  },
  switchHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
