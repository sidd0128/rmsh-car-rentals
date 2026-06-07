import { StyleSheet } from 'react-native';
import { radius, spacing, typography } from '@app/theme';

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
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    ...typography.h3,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
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
    fontWeight: '600',
  },
  earningsHint: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  earningsMeta: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  surfaceCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  /** Nested panel inside cards or modal summaries */
  insetPanel: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  emptyHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  syncCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  formStack: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
