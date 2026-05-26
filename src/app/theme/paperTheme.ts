import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { buttonLabelStyle } from './buttonMetrics';
import { colors } from './colors';
import { radius } from './radius';

const fontConfig = configureFonts({ config: { fontFamily: 'System' } });

export const paperTheme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.textInverse,
    onSurface: colors.text,
    outline: colors.border,
  },
  components: {
    Button: {
      labelStyle: buttonLabelStyle,
    },
    SegmentedButtons: {
      style: { minHeight: 48 },
    },
  },
};
