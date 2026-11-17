import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { foodLogsStore, groupedFoodLogs, foodLogPeriodTotals } from './food-logs.store';
import {
  validateDateRange,
  formatFullDayDate,
  formatCurrentPrintDateTime
} from '../../core/utils/format';

describe('Food Logs Store & Date Range Utilities', () => {
  beforeEach(() => {
    foodLogsStore.reset();
  });

  describe('validateDateRange', () => {
    it('debe aceptar rangos válidos menores o iguales a 60 días (2 meses)', () => {
      const res = validateDateRange('2026-10-01', '2026-10-31', 60);
      expect(res.isValid).toBe(true);
      expect(res.daysCount).toBe(31);
      expect(res.errorMessage).toBeUndefined();
    });

    it('debe rechazar rangos mayores a 60 días con mensaje explícito', () => {
      const res = validateDateRange('2026-08-01', '2026-11-01', 60);
      expect(res.isValid).toBe(false);
      expect(res.daysCount).toBeGreaterThan(60);
      expect(res.errorMessage).toContain('60 días (2 meses)');
    });

    it('debe rechazar si la fecha de inicio es posterior a la de fin', () => {
      const res = validateDateRange('2026-11-20', '2026-11-10', 60);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('fecha de inicio no puede ser posterior');
    });
  });

  describe('formatFullDayDate & formatCurrentPrintDateTime', () => {
    it('debe formatear YYYY-MM-DD en fecha legible completa en español', () => {
      const formatted = formatFullDayDate('2026-11-16');
      expect(formatted).toContain('16 de Noviembre de 2026');
    });

    it('debe formatear la fecha y hora de impresión', () => {
      const testDate = new Date(2026, 10, 16, 21, 30);
      const printStr = formatCurrentPrintDateTime(testDate);
      expect(printStr).toBe('16 de Noviembre de 2026 a las 21:30');
    });
  });

  describe('foodLogsStore functionality', () => {
    it('debe permitir cambiar presets entre 7 y 14 días y custom', () => {
      foodLogsStore.setPreset('14');
      let state = get(foodLogsStore);
      expect(state.preset).toBe('14');
      expect(state.validationError).toBeNull();

      foodLogsStore.setPreset('custom');
      state = get(foodLogsStore);
      expect(state.preset).toBe('custom');
    });

    it('debe aceptar y aplicar un rango de fechas personalizado válido menor a 60 días', () => {
      const ok = foodLogsStore.setCustomRange('2026-10-01', '2026-11-15');
      expect(ok).toBe(true);
      const state = get(foodLogsStore);
      expect(state.preset).toBe('custom');
      expect(state.startDate).toBe('2026-10-01');
      expect(state.endDate).toBe('2026-11-15');
      expect(state.validationError).toBeNull();
    });

    it('debe validar el rango personalizado y rechazar si excede 60 días', () => {
      const ok = foodLogsStore.setCustomRange('2026-08-01', '2026-11-16');
      expect(ok).toBe(false);
      const state = get(foodLogsStore);
      expect(state.validationError).toContain('60 días');
    });

    it('debe agregar un alimento y calcular totales agrupados por día con hora secundaria', () => {
      foodLogsStore.setPreset('7');
      const today = get(foodLogsStore).endDate;

      foodLogsStore.addLog({
        date: today,
        time: '08:30',
        title: 'Avena con Almendras',
        amount: 200,
        unit: 'g',
        calories: 350,
        proteinGrams: 15,
        carbsGrams: 50,
        fatsGrams: 10
      });

      foodLogsStore.addLog({
        date: today,
        time: '13:45',
        title: 'Salmón a la Plancha',
        amount: 300,
        unit: 'g',
        calories: 600,
        proteinGrams: 45,
        carbsGrams: 10,
        fatsGrams: 30
      });

      const groups = get(groupedFoodLogs);
      expect(groups.length).toBeGreaterThanOrEqual(1);

      const todayGroup = groups.find((g) => g.date === today);
      expect(todayGroup).toBeDefined();
      expect(todayGroup?.items.length).toBe(2);
      expect(todayGroup?.items[0].time).toBe('08:30');
      expect(todayGroup?.items[1].time).toBe('13:45');
      expect(todayGroup?.totalCalories).toBe(950);
      expect(todayGroup?.totalProteinGrams).toBe(60);

      const totals = get(foodLogPeriodTotals);
      expect(totals.totalCalories).toBeGreaterThanOrEqual(950);
      expect(totals.totalProtein).toBeGreaterThanOrEqual(60);
    });

    it('debe permitir eliminar un registro de comida existente', () => {
      const today = get(foodLogsStore).endDate;

      foodLogsStore.addLog({
        date: today,
        time: '19:00',
        title: 'Cena Ligera',
        amount: 1,
        unit: 'porción',
        calories: 200,
        proteinGrams: 20,
        carbsGrams: 5,
        fatsGrams: 5
      });

      let items = get(foodLogsStore).items;
      const target = items.find((i) => i.title === 'Cena Ligera');
      expect(target).toBeDefined();

      foodLogsStore.deleteLog(target!.id);
      items = get(foodLogsStore).items;
      expect(items.find((i) => i.id === target!.id)).toBeUndefined();
    });
  });
});
