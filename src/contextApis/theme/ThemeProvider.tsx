import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { colors, paperTheme } from '@app/theme';
import { ThemeContext, type ThemeMode } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo(
    () => ({
      mode,
      colors,
      paperTheme,
      setMode,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
