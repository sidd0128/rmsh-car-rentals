import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import { buttonLabelStyle } from './buttonMetrics';
import { colors, darkColors, type AppColors } from './colors';
import { radius } from './radius';

const fontConfig = configureFonts({ config: { fontFamily: 'System' } });

const buildPaperTheme = (
  baseTheme: typeof MD3LightTheme,
  appColors: AppColors,
) => ({
  ...baseTheme,
  fonts: fontConfig,
  roundness: radius.md,
  colors: {
    ...baseTheme.colors,
    primary: appColors.primary,
    secondary: appColors.secondary,
    background: appColors.background,
    surface: appColors.surface,
    surfaceVariant: appColors.surfaceElevated,
    error: appColors.error,
    onPrimary: appColors.textInverse,
    onSurface: appColors.text,
    onBackground: appColors.text,
    outline: appColors.border,
  },
  components: {
    Button: {
      labelStyle: buttonLabelStyle,
    },
    SegmentedButtons: {
      style: { minHeight: 48 },
    },
  },
});

export const paperTheme = buildPaperTheme(MD3LightTheme, colors);
export const darkPaperTheme = buildPaperTheme(MD3DarkTheme, darkColors);
