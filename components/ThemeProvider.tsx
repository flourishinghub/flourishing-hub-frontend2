'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeName = 'dark' | 'light-1' | 'light-2' | 'light-3';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'fh-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (next: ThemeName) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
