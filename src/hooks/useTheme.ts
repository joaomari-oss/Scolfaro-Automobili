import { useState, useEffect } from 'react';
import { getTheme, setTheme as persistTheme } from '../utils/storage';

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const stored = getTheme();
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'dark'; // default to dark
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
