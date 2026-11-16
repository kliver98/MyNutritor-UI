import { describe, it, expect } from 'vitest';
import {
  roundToDecimals,
  formatNumber,
  formatGrams,
  formatCalories,
  getLocalDateStr,
  getYesterdayDateStr,
  getPastDateStr,
  formatDisplayDate,
  formatShortDate,
  parseColorToCss,
  cssColorToArgbInt,
  isColorDark
} from './format';

describe('format utils', () => {
  it('debe redondear valores con artefactos de punto flotante a máximo 2 decimales', () => {
    expect(roundToDecimals(parseFloat('9.3000000190734863'))).toBe(9.3);
    expect(roundToDecimals(parseFloat('2.200000047683716'))).toBe(2.2);
    expect(roundToDecimals(15.6789)).toBe(15.68);
    expect(roundToDecimals(10.0)).toBe(10);
    expect(roundToDecimals(null)).toBe(0);
    expect(roundToDecimals(undefined)).toBe(0);
    expect(roundToDecimals('3.14159')).toBe(3.14);
  });

  it('debe formatear a string sin ceros redundantes pero con máximo 2 decimales', () => {
    expect(formatNumber(parseFloat('9.3000000190734863'))).toBe('9.3');
    expect(formatNumber(15.678)).toBe('15.68');
    expect(formatNumber(20)).toBe('20');
    expect(formatNumber(0)).toBe('0');
  });

  it('debe formatear gramos y calorías con sus sufijos', () => {
    expect(formatGrams(parseFloat('9.3000000190734863'))).toBe('9.3g');
    expect(formatCalories(250.7)).toBe('251 kcal');
  });

  it('debe calcular la fecha local YYYY-MM-DD sin adelantarse al día siguiente en horas de la tarde', () => {
    // 15 de noviembre de 2026 a las 7:05 PM local
    const localDate = new Date(2026, 10, 15, 19, 5, 0); // Mes 10 es noviembre (0-indexed)
    expect(getLocalDateStr(localDate)).toBe('2026-11-15');
    expect(getYesterdayDateStr(localDate)).toBe('2026-11-14');
    expect(getPastDateStr(7, localDate)).toBe('2026-11-08');
  });

  it('debe formatear fechas para visualización y gráficos', () => {
    expect(formatDisplayDate('2026-11-15')).toBe('15/11/2026');
    expect(formatDisplayDate('')).toBe('N/A');
    expect(formatShortDate('2026-11-15')).toBe('15 Nov');
    expect(formatShortDate('2026-05-04')).toBe('04 May');
  });

  it('debe convertir enteros ARGB de Firestore a códigos hexadecimales CSS y viceversa', () => {
    // -14651472 es #206fb0
    expect(parseColorToCss(-14651472)).toBe('#206fb0');
    expect(parseColorToCss('-14651472')).toBe('#206fb0');
    expect(parseColorToCss('#206fb0')).toBe('#206fb0');
    expect(parseColorToCss('206fb0')).toBe('#206fb0');
    expect(parseColorToCss(-1)).toBe('#ffffff');
    expect(parseColorToCss(0)).toBeUndefined();
    expect(parseColorToCss(null)).toBeUndefined();
    expect(parseColorToCss(undefined)).toBeUndefined();

    // Inversa
    expect(cssColorToArgbInt('#206fb0')).toBe(-14651472);
  });

  it('debe detectar correctamente si un color CSS es oscuro para contraste WCAG', () => {
    expect(isColorDark('#206fb0')).toBe(true);
    expect(isColorDark('#000000')).toBe(true);
    expect(isColorDark('#1e293b')).toBe(true);
    expect(isColorDark('#ffffff')).toBe(false);
    expect(isColorDark('#f8fafc')).toBe(false);
    expect(isColorDark(null)).toBe(false);
  });
});
