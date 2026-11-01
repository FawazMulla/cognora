import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { fetchApi } from '../lib/api';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'comfortable' | 'standard' | 'compact';
export type LanguageMode = 'english' | 'hinglish';

interface PreferencesContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;
  language: LanguageMode;
  setLanguage: (language: LanguageMode) => void;
  isDark: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  theme: 'system',
  setTheme: () => {},
  density: 'standard',
  setDensity: () => {},
  language: 'english',
  setLanguage: () => {},
  isDark: false,
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('cognora_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
    return 'system';
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem('cognora_density');
      if (saved === 'comfortable' || saved === 'standard' || saved === 'compact') return saved;
    } catch {}
    return 'standard';
  });

  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem('cognora_language');
      if (saved === 'english' || saved === 'hinglish') return saved;
    } catch {}
    return 'english';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cognora_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply Theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const computeIsDark = (selectedTheme: ThemeMode): boolean => {
      if (selectedTheme === 'dark') return true;
      if (selectedTheme === 'light') return false;
      return mediaQuery.matches;
    };

    const activeDark = computeIsDark(theme);
    setIsDark(activeDark);

    if (activeDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    const listener = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setIsDark(e.matches);
        if (e.matches) {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
        }
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Apply Density
  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  // Sync with API on mount
  useEffect(() => {
    async function loadServerPreferences() {
      try {
        const res = await fetchApi('/api/preferences');
        if (res && res.preferences) {
          if (res.preferences.theme) setThemeState(res.preferences.theme);
          if (res.preferences.readingDensity) setDensityState(res.preferences.readingDensity);
          if (res.preferences.languagePreference) setLanguageState(res.preferences.languagePreference);
        }
      } catch {
        // Offline / unauthenticated fallback to local state
      }
    }
    void loadServerPreferences();
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('cognora_theme', newTheme);
    } catch {}
    void fetchApi('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {});
  };

  const setDensity = (newDensity: DensityMode) => {
    setDensityState(newDensity);
    try {
      localStorage.setItem('cognora_density', newDensity);
    } catch {}
    void fetchApi('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingDensity: newDensity }),
    }).catch(() => {});
  };

  const setLanguage = (newLanguage: LanguageMode) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem('cognora_language', newLanguage);
    } catch {}
    void fetchApi('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ languagePreference: newLanguage }),
    }).catch(() => {});
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        setTheme,
        density,
        setDensity,
        language,
        setLanguage,
        isDark,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

