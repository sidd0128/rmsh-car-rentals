import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useDeviceLayout } from '@core/hooks/useDeviceLayout';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Centers content on tablets with a max width so lists/forms do not stretch edge-to-edge.
 */
export const ResponsiveContainer = memo<ResponsiveContainerProps>(({ children, style }) => {
  const { contentMaxWidth, isTablet } = useDeviceLayout();

  return (
    <View style={[styles.outer, isTablet && styles.tabletOuter, style]}>
      <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: { width: '100%' },
  tabletOuter: { alignItems: 'center' },
  inner: { width: '100%' },
});
