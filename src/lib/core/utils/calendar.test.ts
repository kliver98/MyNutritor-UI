import { describe, it, expect } from 'vitest';
import {
  toDateString,
  parseDateString,
  getNextMonth,
  getPrevMonth,
  getMonthCalendarGrid,
  getDaysDifference,
  getPresetStartDate
} from './calendar';

describe('calendar utils (Booking / Airline style range calendar)', () => {
  it('debe convertir año, mes (0-11) y día a YYYY-MM-DD', () => {
    expect(toDateString(2026, 10, 17)).toBe('2026-11-17');
    expect(toDateString(2026, 0, 5)).toBe('2026-01-05');
  });

  it('debe parsear YYYY-MM-DD a objeto con año, mes base 0 y día', () => {
    const parsed = parseDateString('2026-11-17');
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(10);
    expect(parsed.day).toBe(17);
  });

  it('debe calcular mes siguiente y mes anterior correctamente respetando cambios de año', () => {
    expect(getNextMonth(2026, 10)).toEqual({ year: 2026, month: 11 });
    expect(getNextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });

    expect(getPrevMonth(2026, 10)).toEqual({ year: 2026, month: 9 });
    expect(getPrevMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
  });

  it('debe generar la cuadrícula de días con múltiplos de 7 y marcar mes actual', () => {
    // Noviembre 2026 tiene 30 días, 1 de nov es Domingo (debe tener 6 días de relleno de Octubre si semana inicia en Lunes)
    const grid = getMonthCalendarGrid(2026, 10);
    expect(grid.length % 7).toBe(0);
    const currentMonthDays = grid.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(30);
  });

  it('debe calcular la diferencia de días correctamente', () => {
    expect(getDaysDifference('2026-11-10', '2026-11-17')).toBe(8);
    expect(getDaysDifference('2026-11-17', '2026-11-17')).toBe(1);
    expect(getDaysDifference('2026-10-01', '2026-10-31')).toBe(31);
    expect(getDaysDifference('2026-09-19', '2026-11-17')).toBe(60);
  });

  it('debe calcular la fecha inicial de presets conteniendo exactamente el número solicitado de días', () => {
    const end = '2026-11-17';
    // 7 días inclusive: del 11 al 17 de noviembre (7 días)
    const start7 = getPresetStartDate(end, 7);
    expect(start7).toBe('2026-11-11');
    expect(getDaysDifference(start7, end)).toBe(7);

    // 14 días inclusive: del 04 al 17 de noviembre (14 días)
    const start14 = getPresetStartDate(end, 14);
    expect(start14).toBe('2026-11-04');
    expect(getDaysDifference(start14, end)).toBe(14);

    // 30 días inclusive: del 19 de octubre al 17 de noviembre (30 días)
    const start30 = getPresetStartDate(end, 30);
    expect(start30).toBe('2026-10-19');
    expect(getDaysDifference(start30, end)).toBe(30);

    // 60 días inclusive (Máx 2 meses): del 19 de septiembre al 17 de noviembre (60 días exactos, no 61)
    const start60 = getPresetStartDate(end, 60);
    expect(start60).toBe('2026-09-19');
    expect(getDaysDifference(start60, end)).toBe(60);
  });
});
