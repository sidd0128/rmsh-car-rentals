import React, { memo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { spacing, typography } from '@app/theme';

interface ScreenSectionProps {
  title?: string;
  children: ReactNode;
  /** Skip top margin — use for the first block after a hero or title row. */
  first?: boolean;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ScreenSection = memo<ScreenSectionProps>(
  ({ title, children, first = false, showDivider = false, style }) => (
    <View style={[styles.section, !first && styles.sectionSpaced, style]}>
      {showDivider ? <Divider style={styles.divider} /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  ),
);

const styles = StyleSheet.create({
  section: {},
  sectionSpaced: {
    marginTop: spacing.xl,
  },
  divider: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  body: {
    gap: spacing.sm,
  },
});
