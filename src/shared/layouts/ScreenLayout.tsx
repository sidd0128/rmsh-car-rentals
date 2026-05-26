import React, { memo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@app/theme';
import { spacing } from '@app/theme/spacing';
import { getScreenBottomClearance } from '@core/helpers/screenBottomInset';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';
import { useOptionalBottomTabBarHeight } from '@core/hooks/useOptionalBottomTabBarHeight';
import { ResponsiveContainer } from './ResponsiveContainer';
import { CONTENT_GAP } from './screenStyles';

interface ScreenLayoutProps {
  children: React.ReactNode;
  /** Full-width block above padded content (e.g. car photo carousel). */
  bleedTop?: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ScreenLayout = memo<ScreenLayoutProps>(
  ({
    children,
    bleedTop,
    scrollable = true,
    padded = true,
    style,
    contentStyle,
    onRefresh,
    refreshing,
  }) => {
    const insets = useSafeAreaInsets();
    const { horizontalPadding } = useDeviceLayout();
    const tabBarHeight = useOptionalBottomTabBarHeight();

    const paddedContent = (
      <ResponsiveContainer>
        <View
          style={[
            padded && styles.padded,
            padded && { paddingHorizontal: horizontalPadding },
            padded && styles.contentGap,
            style,
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ResponsiveContainer>
    );

    if (!scrollable) {
      return (
        <View style={styles.container}>
          {bleedTop}
          {paddedContent}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: getScreenBottomClearance(tabBarHeight, insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {bleedTop}
        {paddedContent}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  padded: { paddingTop: spacing.lg },
  contentGap: { gap: CONTENT_GAP },
});
