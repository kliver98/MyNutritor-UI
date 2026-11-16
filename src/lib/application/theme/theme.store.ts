import { writable, derived } from 'svelte/store';
import { ENV } from '../../core/config/env';
import { isColorDark } from '../../core/utils/format';

export type ThemeMode = 'light' | 'dark';

function getSavedCustomBg(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return typeof window.localStorage !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(ENV.STORAGE_KEYS.CUSTOM_BG)
      : null;
  } catch {
    return null;
  }
}

export const customBgStore = writable<string | null>(getSavedCustomBg());
export const isCustomBgDark = derived(customBgStore, (bg) => isColorDark(bg));

function getSavedTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    return typeof window.localStorage !== 'undefined' && window.localStorage
      ? (window.localStorage.getItem(ENV.STORAGE_KEYS.THEME_MODE) as ThemeMode | null)
      : null;
  } catch {
    return null;
  }
}

function getInitialTheme(): ThemeMode {
  const saved = getSavedTheme();
  if (saved) return saved;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

function createThemeStore() {
  const isBrowser = typeof window !== 'undefined';
  const initialTheme: ThemeMode = getInitialTheme();

  const { subscribe, set, update } = writable<ThemeMode>(initialTheme);

  const applyTheme = (theme: ThemeMode) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(ENV.STORAGE_KEYS.THEME_MODE, theme);
        }
      } catch {
        // Ignorar si localStorage no está disponible
      }
    }
  };

  const applyCustomBg = (color: string | null) => {
    customBgStore.set(color);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (color) {
        document.body.style.backgroundColor = color;
        root.style.setProperty('--user-bg-color', color);
      } else {
        document.body.style.backgroundColor = '';
        root.style.removeProperty('--user-bg-color');
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          if (color) {
            window.localStorage.setItem(ENV.STORAGE_KEYS.CUSTOM_BG, color);
          } else {
            window.localStorage.removeItem(ENV.STORAGE_KEYS.CUSTOM_BG);
          }
        }
      } catch {
        // Ignorar
      }
    }
  };

  // Inicializar en cliente
  if (isBrowser) {
    applyTheme(initialTheme);
    const savedBg = getSavedCustomBg();
    if (savedBg) {
      applyCustomBg(savedBg);
    }
  }

  return {
    subscribe,
    customBg: customBgStore,
    toggle: () => {
      update((current) => {
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        return next;
      });
    },
    setTheme: (theme: ThemeMode) => {
      applyTheme(theme);
      set(theme);
    },
    setBackground: (color: string | null) => {
      applyCustomBg(color);
    },
    clearBackground: () => {
      applyCustomBg(null);
    }
  };
}

export const themeStore = createThemeStore();
