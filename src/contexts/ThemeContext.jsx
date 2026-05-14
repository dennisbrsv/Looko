import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'solarized', label: 'Solarized', icon: '🎨' },
  { id: 'high-contrast', label: 'High Contrast', icon: '⚡' },
];

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem("search-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  const setTheme = useCallback((t) => {
    setThemeState(t);
    try {
      localStorage.setItem("search-theme", t);
    } catch { }
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
