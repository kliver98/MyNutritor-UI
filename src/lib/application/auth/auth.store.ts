import { writable, derived } from 'svelte/store';
import type { User, LoginCredentials, RegisterData } from '../../domain/auth/User';
import { repositories } from '../../infrastructure/container';
import { defaultTokenStorage } from '../../core/storage/TokenStorage';
import { AppHttpError, defaultHttpClient } from '../../core/http/HttpClient';
import { foodsStore } from '../foods/foods.store';
import { recipesStore } from '../recipes/recipes.store';
import { macrosStore } from '../macros/macros.store';
import { reportsStore } from '../reports/reports.store';
import { draftsStore } from '../drafts/drafts.store';
import { adminStore } from '../admin/admin.store';
import { settingsStore } from '../settings/settings.store';
import { toastStore } from '../../core/feedback/toast.store';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

function createAuthStore() {
  const initialUser = defaultTokenStorage.getUser<User>();
  const initialToken = defaultTokenStorage.getToken();

  const { subscribe, update } = writable<AuthState>({
    user: initialUser,
    token: initialToken,
    isLoading: false,
    error: null,
    isInitialized: false
  });

  const store = {
    subscribe,

    async init(): Promise<void> {
      if (defaultHttpClient.setOnUnauthorized) {
        defaultHttpClient.setOnUnauthorized(() => {
          store.handleUnauthorized();
        });
      }

      const token = defaultTokenStorage.getToken();
      if (!token) {
        update((s) => ({ ...s, isInitialized: true, isLoading: false }));
        return;
      }

      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const user = await repositories.auth.getMe();
        update((s) => ({
          ...s,
          user,
          token,
          isLoading: false,
          isInitialized: true
        }));
        settingsStore.fetchSettings();
      } catch (err: unknown) {
        // Token expirado o inválido
        defaultTokenStorage.clear();
        update((s) => ({
          ...s,
          user: null,
          token: null,
          isLoading: false,
          isInitialized: true,
          error: (err as Error)?.message || 'Sesión expirada'
        }));
      }
    },

    async login(credentials: LoginCredentials): Promise<boolean> {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await repositories.auth.login(credentials);
        update((s) => ({
          ...s,
          user: session.user,
          token: session.token,
          isLoading: false,
          error: null
        }));
        settingsStore.fetchSettings();
        return true;
      } catch (err: unknown) {
        let msg = 'Error al iniciar sesión';
        if (err instanceof AppHttpError) {
          msg = err.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        update((s) => ({ ...s, isLoading: false, error: msg }));
        return false;
      }
    },

    async register(data: RegisterData): Promise<boolean> {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await repositories.auth.register(data);
        update((s) => ({
          ...s,
          user: session.user,
          token: session.token,
          isLoading: false,
          error: null
        }));
        settingsStore.fetchSettings();
        return true;
      } catch (err: unknown) {
        let msg = 'Error al registrar cuenta';
        if (err instanceof AppHttpError) {
          msg = err.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        update((s) => ({ ...s, isLoading: false, error: msg }));
        return false;
      }
    },

    /**
     * Permite iniciar una sesión de prueba rápida para verificar vistas (Admin vs User)
     */
    setDemoSession(role: 'admin' | 'user'): void {
      const demoUser: User = {
        id: `demo-${role}-01`,
        username: role === 'admin' ? 'admin_demo' : 'nutri_user',
        fullName: role === 'admin' ? 'Administrador Sistema' : 'Usuario Nutrición',
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const demoToken = `demo_jwt_token_${role}_${Date.now()}`;
      defaultTokenStorage.setToken(demoToken);
      defaultTokenStorage.setUser(demoUser);
      update((s) => ({
        ...s,
        user: demoUser,
        token: demoToken,
        isLoading: false,
        error: null,
        isInitialized: true
      }));
    },

    async logout(): Promise<void> {
      update((s) => ({ ...s, isLoading: true }));
      try {
        await repositories.auth.logout();
      } catch {
        // Ignora errores si el backend falla al desloguear
      } finally {
        defaultTokenStorage.clear();
        foodsStore.reset();
        recipesStore.reset();
        macrosStore.reset();
        reportsStore.reset();
        draftsStore.reset();
        adminStore.reset();
        settingsStore.reset();
        update((s) => ({
          ...s,
          user: null,
          token: null,
          isLoading: false,
          error: null
        }));
      }
    },

    handleUnauthorized(): void {
      defaultTokenStorage.clear();
      foodsStore.reset();
      recipesStore.reset();
      macrosStore.reset();
      reportsStore.reset();
      draftsStore.reset();
      adminStore.reset();
      settingsStore.reset();
      update((s) => ({
        ...s,
        user: null,
        token: null,
        isLoading: false,
        error: 'Sesión expirada'
      }));
      toastStore.warning('Sesión expirada. Por favor, inicia sesión de nuevo.');
    },

    clearError(): void {
      update((s) => ({ ...s, error: null }));
    }
  };

  return store;
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(authStore, ($auth) => !!$auth.token && !!$auth.user);

export const currentUser = derived(authStore, ($auth) => $auth.user);

export const isAdmin = derived(
  authStore,
  ($auth) =>
    $auth.user?.role?.toLowerCase() === 'admin' ||
    $auth.user?.roleId === '1' ||
    String($auth.user?.role) === '1'
);
