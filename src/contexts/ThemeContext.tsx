import React, { createContext, useContext, useLayoutEffect, useEffect, useState, ReactNode } from 'react';

// Falls back to useEffect in non-browser environments (SSR, tests, prerender)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Guard: browser globals are not available in SSR/test environments
    if (typeof window === 'undefined') return false;

    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {
      // localStorage may be blocked (privacy mode, storage quota, etc.)
    }

    // Respect OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Runs synchronously before paint — eliminates flash of wrong theme.
  // Falls back to useEffect safely in non-browser environments.
  useIsomorphicLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Persist preference after render (non-blocking)
  useEffect(() => {
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // Silently ignore storage errors
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
