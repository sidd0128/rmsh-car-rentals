import React, { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing, typography } from '@app/theme';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
}

export const CollapsibleSection = memo<CollapsibleSectionProps>(
  ({
    title,
    subtitle,
    expanded,
    onToggle,
    children,
    headerRight,
    containerStyle,
    bodyStyle,
  }) => (
    <View style={[styles.wrap, containerStyle]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.summary}>{subtitle}</Text> : null}
        </View>
        {headerRight}
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </Pressable>
      {expanded ? <View style={[styles.body, bodyStyle]}>{children}</View> : null}
    </View>
  ),
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
