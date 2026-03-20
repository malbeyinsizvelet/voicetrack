import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; isDark: boolean; }

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggleTheme: () => {}, isDark: true });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => { try { return (localStorage.getItem('vt_theme') as Theme) ?? 'dark'; } catch { return 'dark'; } });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('vt_theme', theme); } catch {}
  }, [theme]);

  function toggleTheme() { setTheme((t) => (t === 'dark' ? 'light' : 'dark')); }

  return <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
