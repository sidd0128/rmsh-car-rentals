import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';
import { typography } from '@app/theme/typography';
import { radius } from '@app/theme/radius';

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  meta?: string;
}

interface TimelineViewProps {
  items: TimelineItem[];
  emptyMessage?: string;
}

export const TimelineView = memo<TimelineViewProps>(
  ({ items, emptyMessage = 'No history yet' }) => {
    if (!items.length) {
      return <Text style={styles.empty}>{emptyMessage}</Text>;
    }

    return (
      <View>
        {items.map((item, index) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.lineCol}>
              <View style={styles.dot} />
              {index < items.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={typography.h4}>{item.title}</Text>
              {item.subtitle ? <Text style={typography.bodySmall}>{item.subtitle}</Text> : null}
              <Text style={styles.date}>{item.date}</Text>
              {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.lg },
  lineCol: { width: 24, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  content: { flex: 1, paddingLeft: spacing.sm },
  date: { ...typography.caption, marginTop: spacing.xs },
  meta: { ...typography.bodySmall, color: colors.primary, marginTop: 2 },
  empty: { ...typography.bodySmall, textAlign: 'center', padding: spacing.xl },
});
