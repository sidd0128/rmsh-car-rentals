import { createContext } from 'react';
import { colors, paperTheme } from '@app/theme';

export type ThemeMode = 'light';

export interface ThemeContextValue {
  mode: ThemeMode;
  colors: typeof colors;
  paperTheme: typeof paperTheme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
