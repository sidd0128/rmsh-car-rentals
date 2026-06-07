import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { colors, darkColors, darkPaperTheme, paperTheme } from '@app/theme';
import { STORAGE_KEYS } from '@core/storage/storageKeys';
import { storageService } from '@core/storage/storageService';
import { ThemeContext, type ThemeMode } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const activeColors = mode === 'dark' ? darkColors : colors;
  const activePaperTheme = mode === 'dark' ? darkPaperTheme : paperTheme;

  useEffect(() => {
    storageService.getItem<ThemeMode>(STORAGE_KEYS.THEME_MODE)
      .then(savedMode => {
        if (savedMode === 'light' || savedMode === 'dark') {
          setMode(savedMode);
        }
      })
      .catch(() => undefined);
  }, []);

  const updateMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    storageService.setItem(STORAGE_KEYS.THEME_MODE, nextMode).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: activeColors,
      paperTheme: activePaperTheme,
      isDark: mode === 'dark',
      setMode: updateMode,
    }),
    [activeColors, activePaperTheme, mode, updateMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
