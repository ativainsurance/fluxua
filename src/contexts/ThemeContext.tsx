import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors, ColorScheme } from '../theme';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDark: boolean;
  mode: ThemeMode;
  colors: ColorScheme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = '@fluxua_theme_mode';

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemDark = Appearance.getColorScheme() === 'dark';
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load persisted preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    }).catch(() => {});
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const isDark = mode === 'system' ? systemDark : mode === 'dark';
  const activeColors: ColorScheme = isDark ? (darkColors as unknown as ColorScheme) : colors;

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        mode,
        colors: activeColors,
        toggleTheme,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
