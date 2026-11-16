import { describe, it, expect } from 'vitest';
import { computeReportStats } from './reports.store';
import type { DailyMacro } from '../../domain/users/UserManagement';

describe('reportsStore.computeReportStats', () => {
  const mockMacros: DailyMacro[] = [
    {
      date: '2026-11-10',
      userId: 'usr_1',
      calories: 2000,
      targetCalories: 2200,
      proteinGrams: 150,
      carbsGrams: 200,
      fatsGrams: 60
    },
    {
      date: '2026-11-12',
      userId: 'usr_1',
      calories: 2400,
      targetCalories: 2200,
      proteinGrams: 160,
      carbsGrams: 250,
      fatsGrams: 75
    },
    {
      date: '2026-11-15',
      userId: 'usr_1',
      calories: 1800,
      targetCalories: 2200,
      proteinGrams: 140,
      carbsGrams: 180,
      fatsGrams: 50
    }
  ];

  it('debe calcular promedios y métricas reales basadas únicamente en los datos de la API', () => {
    const stats = computeReportStats(mockMacros, '2026-11-09', '2026-11-15');

    expect(stats.daysWithData).toBe(3);
    // (2000 + 2400 + 1800) / 3 = 6200 / 3 = 2067 kcal
    expect(stats.summary.averageCalories).toBe(2067);
    // (150 + 160 + 140) / 3 = 450 / 3 = 150g
    expect(stats.summary.averageProtein).toBe(150);
    // (200 + 250 + 180) / 3 = 630 / 3 = 210g
    expect(stats.summary.averageCarbs).toBe(210);
    // (60 + 75 + 50) / 3 = 185 / 3 = 61.67g
    expect(stats.summary.averageFats).toBe(61.67);

    // Días dentro de la meta: 2 de 3 (2000 <= 2200, 1800 <= 2200) -> 67%
    expect(stats.adherencePercent).toBe(67);
    expect(stats.dailyRecords).toHaveLength(3);
  });

  it('debe devolver valores seguros en 0 cuando no hay registros en el rango seleccionado', () => {
    const stats = computeReportStats(mockMacros, '2026-10-01', '2026-10-05');

    expect(stats.daysWithData).toBe(0);
    expect(stats.summary.averageCalories).toBe(0);
    expect(stats.summary.averageProtein).toBe(0);
    expect(stats.adherencePercent).toBe(0);
    expect(stats.dailyRecords).toHaveLength(0);
  });
});
