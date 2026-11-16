import { writable, derived } from 'svelte/store';
import { es, en, type Locale, type TranslationDict } from './translations';

const STORAGE_LOCALE_KEY = 'mynutritor_locale';

const dictionaries: Record<Locale, TranslationDict> = { es, en };

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'es';
  try {
    const saved = window.localStorage.getItem(STORAGE_LOCALE_KEY) as Locale | null;
    if (saved === 'es' || saved === 'en') return saved;
    const browserLang = window.navigator.language?.toLowerCase();
    if (browserLang?.startsWith('en')) return 'en';
    return 'es';
  } catch {
    return 'es';
  }
}

export const localeStore = writable<Locale>(getInitialLocale());
export type { Locale } from './translations';

export function setLocale(locale: Locale): void {
  localeStore.set(locale);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_LOCALE_KEY, locale);
      document.documentElement.lang = locale;
    } catch {
      // storage unavailable
    }
  }
}

export function toggleLocale(): void {
  localeStore.update((current) => {
    const next: Locale = current === 'es' ? 'en' : 'es';
    setLocale(next);
    return next;
  });
}

/**
 * Función de traducción reactiva con soporte de parámetros dinámicos {param}
 */
export const t = derived(localeStore, ($locale) => {
  const dict = dictionaries[$locale] || dictionaries.es;

  return (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: unknown = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        // Fallback a español si no se encuentra
        let fallback: unknown = dictionaries.es;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = (fallback as Record<string, unknown>)[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (!params) return current;

    return Object.entries(params).reduce(
      (str, [paramKey, paramVal]) =>
        str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal)),
      current
    );
  };
});
