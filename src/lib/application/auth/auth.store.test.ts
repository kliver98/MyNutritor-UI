import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, isAuthenticated, isAdmin } from './auth.store';
import { foodsStore } from '../foods/foods.store';
import { themeStore, customBgStore } from '../theme/theme.store';
import { defaultTokenStorage } from '../../core/storage/TokenStorage';

describe('auth.store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    defaultTokenStorage.clear();
    authStore.logout();
  });

  it('debe persistir usuario y token al iniciar sesión demo', () => {
    authStore.setDemoSession('admin');

    const state = get(authStore);
    expect(state.user).not.toBeNull();
    expect(state.user?.username).toBe('admin_demo');
    expect(get(isAuthenticated)).toBe(true);
    expect(get(isAdmin)).toBe(true);

    expect(defaultTokenStorage.getToken()).toBeTruthy();
    expect(defaultTokenStorage.getUser()).not.toBeNull();
  });

  it('debe limpiar token, usuario, fondo personalizado y resetear stores al hacer logout', async () => {
    authStore.setDemoSession('user');
    themeStore.setBackground('#206fb0');
    expect(get(isAuthenticated)).toBe(true);
    expect(get(customBgStore)).toBe('#206fb0');

    await authStore.logout();

    expect(get(authStore).user).toBeNull();
    expect(get(authStore).token).toBeNull();
    expect(get(isAuthenticated)).toBe(false);
    expect(get(customBgStore)).toBeNull();
    expect(defaultTokenStorage.getToken()).toBeNull();
    expect(defaultTokenStorage.getUser()).toBeNull();
    expect(get(foodsStore).items).toEqual([]);
  });

  it('debe limpiar todo el estado en handleUnauthorized', () => {
    authStore.setDemoSession('user');
    expect(get(isAuthenticated)).toBe(true);

    authStore.handleUnauthorized();

    expect(get(authStore).user).toBeNull();
    expect(get(authStore).token).toBeNull();
    expect(get(isAuthenticated)).toBe(false);
    expect(defaultTokenStorage.getToken()).toBeNull();
    expect(defaultTokenStorage.getUser()).toBeNull();
  });
});
