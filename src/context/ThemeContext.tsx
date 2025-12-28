import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  argbFromHex, 
  themeFromSourceColor, 
  hexFromArgb 
} from '@material/material-color-utilities';

interface ThemeContextType {
  seedColor: string;
  setSeedColor: (color: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default seed color (Guarnold Blue)
const DEFAULT_SEED = '#3b82f6';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [seedColor, setSeedColorState] = useState<string>(() => {
    return localStorage.getItem('theme_seed') || DEFAULT_SEED;
  });
  
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme_mode') === 'dark';
  });

  const setSeedColor = (color: string) => {
    setSeedColorState(color);
    localStorage.setItem('theme_seed', color);
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      localStorage.setItem('theme_mode', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  useEffect(() => {
    try {
      // 1. Generate the Material Design 3 theme from the seed color
      const intColor = argbFromHex(seedColor);
      const theme = themeFromSourceColor(intColor);
      
      // 2. Select the correct scheme based on dark/light mode
      const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

      // 3. Map MD3 tokens to CSS variables
      const root = document.documentElement;

      // Helper to set variable
      const setVar = (name: string, value: number) => {
        root.style.setProperty(`--md-sys-color-${name}`, hexFromArgb(value));
      };

      // Core Palette
      setVar('primary', scheme.primary);
      setVar('on-primary', scheme.onPrimary);
      setVar('primary-container', scheme.primaryContainer);
      setVar('on-primary-container', scheme.onPrimaryContainer);

      setVar('secondary', scheme.secondary);
      setVar('on-secondary', scheme.onSecondary);
      setVar('secondary-container', scheme.secondaryContainer);
      setVar('on-secondary-container', scheme.onSecondaryContainer);

      setVar('tertiary', scheme.tertiary);
      setVar('on-tertiary', scheme.onTertiary);
      setVar('tertiary-container', scheme.tertiaryContainer);
      setVar('on-tertiary-container', scheme.onTertiaryContainer);

      // Surfaces & Backgrounds
      setVar('surface', scheme.surface);
      setVar('on-surface', scheme.onSurface);
      setVar('surface-variant', scheme.surfaceVariant);
      setVar('on-surface-variant', scheme.onSurfaceVariant);
      setVar('background', scheme.background);
      setVar('on-background', scheme.onBackground);
      
      setVar('outline', scheme.outline);
      setVar('error', scheme.error);
      setVar('on-error', scheme.onError);

    } catch (error) {
      console.error("Failed to generate theme:", error);
    }
  }, [seedColor, isDark]);

  return (
    <ThemeContext.Provider value={{ seedColor, setSeedColor, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};