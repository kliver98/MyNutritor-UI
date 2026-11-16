import { ENV } from '../config/env';

export interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  getUser<T>(): T | null;
  setUser<T>(user: T): void;
  removeUser(): void;
  clear(): void;
}

/**
 * Implementación segura basada en LocalStorage para navegadores
 */
export class BrowserTokenStorage implements ITokenStorage {
  private fallbackStore: Map<string, string> = new Map();

  private isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return typeof window.localStorage !== 'undefined' && window.localStorage !== null;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (!this.isLocalStorageAvailable()) {
      return this.fallbackStore.get(ENV.STORAGE_KEYS.ACCESS_TOKEN) || null;
    }
    try {
      return window.localStorage.getItem(ENV.STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return this.fallbackStore.get(ENV.STORAGE_KEYS.ACCESS_TOKEN) || null;
    }
  }

  setToken(token: string): void {
    if (!this.isLocalStorageAvailable()) {
      this.fallbackStore.set(ENV.STORAGE_KEYS.ACCESS_TOKEN, token);
      return;
    }
    try {
      window.localStorage.setItem(ENV.STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch {
      this.fallbackStore.set(ENV.STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  }

  removeToken(): void {
    this.fallbackStore.delete(ENV.STORAGE_KEYS.ACCESS_TOKEN);
    if (!this.isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(ENV.STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      // Ignorar
    }
  }

  getUser<T>(): T | null {
    let raw: string | null = null;
    if (this.isLocalStorageAvailable()) {
      try {
        raw = window.localStorage.getItem(ENV.STORAGE_KEYS.USER_PROFILE);
      } catch {
        // Ignorar
      }
    }
    if (!raw) {
      raw = this.fallbackStore.get(ENV.STORAGE_KEYS.USER_PROFILE) || null;
    }
    return raw ? (JSON.parse(raw) as T) : null;
  }

  setUser<T>(user: T): void {
    const raw = JSON.stringify(user);
    if (!this.isLocalStorageAvailable()) {
      this.fallbackStore.set(ENV.STORAGE_KEYS.USER_PROFILE, raw);
      return;
    }
    try {
      window.localStorage.setItem(ENV.STORAGE_KEYS.USER_PROFILE, raw);
    } catch {
      this.fallbackStore.set(ENV.STORAGE_KEYS.USER_PROFILE, raw);
    }
  }

  removeUser(): void {
    this.fallbackStore.delete(ENV.STORAGE_KEYS.USER_PROFILE);
    if (!this.isLocalStorageAvailable()) return;
    try {
      window.localStorage.removeItem(ENV.STORAGE_KEYS.USER_PROFILE);
    } catch {
      // Ignorar
    }
  }

  clear(): void {
    this.fallbackStore.clear();
    this.removeToken();
    this.removeUser();
  }
}

/**
 * Implementación en memoria útil para testing unitario y SSR
 */
export class InMemoryTokenStorage implements ITokenStorage {
  private store: Map<string, string> = new Map();

  getToken(): string | null {
    return this.store.get(ENV.STORAGE_KEYS.ACCESS_TOKEN) || null;
  }

  setToken(token: string): void {
    this.store.set(ENV.STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  removeToken(): void {
    this.store.delete(ENV.STORAGE_KEYS.ACCESS_TOKEN);
  }

  getUser<T>(): T | null {
    const raw = this.store.get(ENV.STORAGE_KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  setUser<T>(user: T): void {
    this.store.set(ENV.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  }

  removeUser(): void {
    this.store.delete(ENV.STORAGE_KEYS.USER_PROFILE);
  }

  clear(): void {
    this.store.clear();
  }
}

// Instancia singleton por defecto para la aplicación
export const defaultTokenStorage: ITokenStorage = new BrowserTokenStorage();
