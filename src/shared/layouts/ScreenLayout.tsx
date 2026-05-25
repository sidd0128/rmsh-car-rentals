import React, { memo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ScreenLayout = memo<ScreenLayoutProps>(
  ({ children, scrollable = true, padded = true, style, onRefresh, refreshing }) => {
    const insets = useSafeAreaInsets();

    const content = (
      <View style={[padded && styles.padded, style]}>{children}</View>
    );

    if (!scrollable) {
      return (
        <View style={[styles.container, { paddingTop: spacing.sm }]}>
          {content}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {content}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
