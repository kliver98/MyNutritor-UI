import { writable, get } from 'svelte/store';
import type { UserSettings } from '../../domain/users/UserManagement';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { themeStore } from '../theme/theme.store';
import { toastStore } from '../../core/feedback/toast.store';

export interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
}

function createSettingsStore() {
  const { subscribe, update } = writable<SettingsState>({
    settings: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    reset() {
      themeStore.clearBackground();
      update(() => ({
        settings: null,
        isLoading: false,
        error: null
      }));
    },

    async fetchSettings() {
      const auth = get(authStore);
      if (!auth.user) return;
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const settings = await repositories.userSettings.getSettings(auth.user.username);
        update((s) => ({ ...s, settings, isLoading: false }));

        if (settings.themePreference === 'dark' || settings.themePreference === 'light') {
          themeStore.setTheme(settings.themePreference);
        }

        if (settings.customBackgroundColor) {
          themeStore.setBackground(settings.customBackgroundColor);
        } else if (settings.customBackgroundColor === undefined && settings.themePreference) {
          themeStore.clearBackground();
        }

        return settings;
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar ajustes'
        }));
      }
    },

    async updateSettings(updates: Partial<UserSettings>) {
      const auth = get(authStore);
      if (!auth.user) return;
      update((s) => ({ ...s, isLoading: true }));
      try {
        const saved = await repositories.userSettings.updateSettings(auth.user.username, updates);
        update((s) => ({ ...s, settings: saved, isLoading: false }));

        if (saved.themePreference === 'dark' || saved.themePreference === 'light') {
          themeStore.setTheme(saved.themePreference);
        }

        if (saved.customBackgroundColor) {
          themeStore.setBackground(saved.customBackgroundColor);
        } else {
          themeStore.clearBackground();
        }

        toastStore.success('Ajustes guardados correctamente');
        return saved;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al guardar ajustes');
        throw err;
      }
    }
  };
}

export const settingsStore = createSettingsStore();
