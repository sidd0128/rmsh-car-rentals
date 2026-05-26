import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Shared touch target + label metrics so button text is not clipped vertically. */
export const buttonMetrics = {
  minHeight: 48,
  paddingVertical: 10,
  paddingHorizontal: 16,
  fontSize: 16,
  lineHeight: 22,
  fontWeight: '600' as const,
};

export const buttonContentStyle: ViewStyle = {
  minHeight: buttonMetrics.minHeight,
  paddingVertical: buttonMetrics.paddingVertical,
  paddingHorizontal: buttonMetrics.paddingHorizontal,
};

export const buttonLabelStyle: TextStyle = {
  fontSize: buttonMetrics.fontSize,
  lineHeight: buttonMetrics.lineHeight,
  fontWeight: buttonMetrics.fontWeight,
  marginVertical: 0,
  marginHorizontal: 0,
  textAlignVertical: 'center',
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
};
