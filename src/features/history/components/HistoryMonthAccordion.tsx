import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing, typography } from '@app/theme';
import { summarizeMonthTimeline, type MonthTimelineEntry } from '@core/helpers/rentalHistory';
import { useTranslation } from '@core/i18n';

interface HistoryMonthAccordionProps {
  monthLabel: string;
  timeline: MonthTimelineEntry[];
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const HistoryMonthAccordion = memo<HistoryMonthAccordionProps>(
  ({ monthLabel, timeline, expanded, onToggle, children }) => {
    const { t } = useTranslation();
    const { rentalCount, freeCount } = summarizeMonthTimeline(timeline);

    return (
      <View style={styles.wrap}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.header, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <View style={styles.headerText}>
            <Text style={styles.title}>{monthLabel}</Text>
            <Text style={styles.summary}>
              {t('history.monthSummary', { rentals: rentalCount, free: freeCount })}
            </Text>
          </View>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.primary}
          />
        </Pressable>
        {expanded ? <View style={styles.body}>{children}</View> : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.92 },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.h4,
  },
  summary: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  body: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
});
