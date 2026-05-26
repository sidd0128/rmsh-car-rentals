import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@app/theme';

/** Shared vertical space between major blocks inside scroll screens. */
export const CONTENT_GAP = spacing.lg;

/** Bottom inset for FlashList screens (clears FAB + tab bar). */
export const LIST_BOTTOM_INSET = spacing.huge + spacing.xl;

export const screenStyles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: LIST_BOTTOM_INSET,
  },
  earningsHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  earningsLead: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '600',
  },
  earningsHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  earningsMeta: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  surfaceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  /** Nested panel inside cards or modal summaries */
  insetPanel: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  emptyHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  syncCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  formStack: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
