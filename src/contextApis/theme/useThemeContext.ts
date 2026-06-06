import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextValue } from './ThemeContext';

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
