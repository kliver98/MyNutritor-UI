import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { localeStore, setLocale, toggleLocale, t } from './i18n.store';

describe('i18n system', () => {
  beforeEach(() => {
    setLocale('es');
  });

  it('debe iniciar en español por defecto', () => {
    expect(get(localeStore)).toBe('es');
  });

  it('debe alternar de español a inglés con toggleLocale()', () => {
    toggleLocale();
    expect(get(localeStore)).toBe('en');

    toggleLocale();
    expect(get(localeStore)).toBe('es');
  });

  it('debe traducir cadenas estáticas en el idioma activo', () => {
    const translate = get(t);
    expect(translate('common.appName')).toBe('MyNutritor');
    expect(translate('common.loading')).toBe('Cargando...');

    setLocale('en');
    const translateEn = get(t);
    expect(translateEn('common.loading')).toBe('Loading...');
  });

  it('debe interpolar parámetros dinámicos {param}', () => {
    const translate = get(t);
    const welcome = translate('dashboard.welcome', { name: 'Alejandro' });
    expect(welcome).toBe('¡Hola, Alejandro!');

    setLocale('en');
    const translateEn = get(t);
    const welcomeEn = translateEn('dashboard.welcome', { name: 'Alex' });
    expect(welcomeEn).toBe('Hello, Alex!');
  });

  it('debe devolver la clave original o fallback en español si la clave no existe', () => {
    const translate = get(t);
    expect(translate('non.existent.key')).toBe('non.existent.key');
  });
});
