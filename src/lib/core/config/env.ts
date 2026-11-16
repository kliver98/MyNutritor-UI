/**
 * Configuración centralizada de variables de entorno y constantes del sistema
 */
export const ENV = {
  API_BASE_URL: (
    import.meta.env.VITE_API_BASE_URL || 'https://my-nutritor-be-74319366403.us-central1.run.app'
  ).replace(/\/$/, ''),
  APP_NAME: 'MyNutritor',
  APP_VERSION: '1.0.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || (import.meta.env.DEV ? 'development' : 'production'),
  DEFAULT_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
  ENABLE_DEMO_SHORTCUTS:
    import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS !== 'false' &&
    import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS !== false &&
    import.meta.env.VITE_ENABLE_DEMO_SHORTCUTS !== '0',
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 500,
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'mynutritor_access_token',
    USER_PROFILE: 'mynutritor_user_session',
    THEME_MODE: 'mynutritor_theme_mode',
    CUSTOM_BG: 'mynutritor_custom_bg'
  }
} as const;

export type SystemConfig = typeof ENV;
