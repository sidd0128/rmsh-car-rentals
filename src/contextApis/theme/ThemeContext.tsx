import { createContext } from 'react';
import { paperTheme, type AppColors } from '@app/theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  mode: ThemeMode;
  colors: AppColors;
  paperTheme: typeof paperTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
