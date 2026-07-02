import React, { memo } from 'react';
import { CollapsibleSection } from '@shared/ui';
import {
  summarizeMonthTimeline,
  type MonthTimelineEntry,
} from '@core/helpers/rentalHistory';
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
      <CollapsibleSection
        title={monthLabel}
        subtitle={t('history.monthSummary', {
          rentals: rentalCount,
          free: freeCount,
        })}
        expanded={expanded}
        onToggle={onToggle}
      >
        {children}
      </CollapsibleSection>
    );
  },
);
