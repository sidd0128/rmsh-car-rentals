import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
} as const;

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text, lineHeight: 24 },
  h4: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.textSecondary, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500', color: colors.textMuted, lineHeight: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: '600', color: colors.textInverse },
};
