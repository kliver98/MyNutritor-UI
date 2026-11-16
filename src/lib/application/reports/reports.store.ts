import { writable, get } from 'svelte/store';
import type { UserReport, DailyMacro } from '../../domain/users/UserManagement';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { toastStore } from '../../core/feedback/toast.store';
import { getLocalDateStr, getPastDateStr, roundToDecimals } from '../../core/utils/format';

export interface CalculatedReport {
  periodStart: string;
  periodEnd: string;
  daysInRange: number;
  daysWithData: number;
  adherencePercent: number;
  summary: {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFats: number;
  };
  targets: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
  };
  dailyRecords: DailyMacro[];
}

export interface ReportsState {
  reports: UserReport[];
  dailyMacros: DailyMacro[];
  currentCalculated: CalculatedReport | null;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  error: string | null;
}

export function computeReportStats(
  macros: DailyMacro[],
  startDate: string,
  endDate: string
): CalculatedReport {
  const inRange = macros.filter((m) => m.date >= startDate && m.date <= endDate);
  inRange.sort((a, b) => a.date.localeCompare(b.date));

  const daysWithData = inRange.length;

  if (daysWithData === 0) {
    return {
      periodStart: startDate,
      periodEnd: endDate,
      daysInRange: 0,
      daysWithData: 0,
      adherencePercent: 0,
      summary: {
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFats: 0
      },
      targets: {
        targetCalories: 2200,
        targetProtein: 160,
        targetCarbs: 220,
        targetFats: 70
      },
      dailyRecords: []
    };
  }

  const totalCalories = inRange.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = inRange.reduce((sum, r) => sum + r.proteinGrams, 0);
  const totalCarbs = inRange.reduce((sum, r) => sum + r.carbsGrams, 0);
  const totalFats = inRange.reduce((sum, r) => sum + r.fatsGrams, 0);

  const avgTargetCal = Math.round(
    inRange.reduce((sum, r) => sum + (r.targetCalories || 2200), 0) / daysWithData
  );
  const avgTargetProtein = roundToDecimals(
    inRange.reduce((sum, r) => sum + (r.targetProteinGrams || 160), 0) / daysWithData,
    2
  );
  const avgTargetCarbs = roundToDecimals(
    inRange.reduce((sum, r) => sum + (r.targetCarbsGrams || 220), 0) / daysWithData,
    2
  );
  const avgTargetFats = roundToDecimals(
    inRange.reduce((sum, r) => sum + (r.targetFatsGrams || 70), 0) / daysWithData,
    2
  );

  const adherentDays = inRange.filter((r) => r.calories <= (r.targetCalories || 2200)).length;
  const adherencePercent = Math.round((adherentDays / daysWithData) * 100);

  return {
    periodStart: startDate,
    periodEnd: endDate,
    daysInRange: daysWithData,
    daysWithData,
    adherencePercent,
    summary: {
      averageCalories: Math.round(totalCalories / daysWithData),
      averageProtein: roundToDecimals(totalProtein / daysWithData, 2),
      averageCarbs: roundToDecimals(totalCarbs / daysWithData, 2),
      averageFats: roundToDecimals(totalFats / daysWithData, 2)
    },
    targets: {
      targetCalories: avgTargetCal,
      targetProtein: avgTargetProtein,
      targetCarbs: avgTargetCarbs,
      targetFats: avgTargetFats
    },
    dailyRecords: inRange
  };
}

function createReportsStore() {
  const initialEnd = getLocalDateStr();
  const initialStart = getPastDateStr(7);

  const { subscribe, update } = writable<ReportsState>({
    reports: [],
    dailyMacros: [],
    currentCalculated: null,
    startDate: initialStart,
    endDate: initialEnd,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    reset() {
      update(() => ({
        reports: [],
        dailyMacros: [],
        currentCalculated: null,
        startDate: getPastDateStr(7),
        endDate: getLocalDateStr(),
        isLoading: false,
        error: null
      }));
    },

    async fetchData(startDate?: string, endDate?: string) {
      const auth = get(authStore);
      if (!auth.user) return;

      const current = get(reportsStore);
      const start = startDate || current.startDate;
      const end = endDate || current.endDate;

      update((s) => ({ ...s, isLoading: true, error: null, startDate: start, endDate: end }));
      try {
        const [dailyMacros, reports] = await Promise.all([
          repositories.dailyMacros.getAll(auth.user.username),
          repositories.reports.getAll(auth.user.username)
        ]);

        const calculated = computeReportStats(dailyMacros, start, end);

        update((s) => ({
          ...s,
          dailyMacros,
          reports,
          currentCalculated: calculated,
          isLoading: false
        }));
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar datos nutricionales'
        }));
      }
    },

    setDateRange(start: string, end: string) {
      const current = get(reportsStore);
      const calculated = computeReportStats(current.dailyMacros, start, end);
      update((s) => ({
        ...s,
        startDate: start,
        endDate: end,
        currentCalculated: calculated
      }));
    },

    async saveCurrentReport(title?: string) {
      const auth = get(authStore);
      if (!auth.user) return;
      const current = get(reportsStore);
      if (!current.currentCalculated) return;

      const rep = current.currentCalculated;
      const defaultTitle = `Informe ${rep.periodStart} al ${rep.periodEnd}`;

      update((s) => ({ ...s, isLoading: true }));
      try {
        const saved = await repositories.reports.create(auth.user.username, {
          title: title || defaultTitle,
          periodStart: rep.periodStart,
          periodEnd: rep.periodEnd,
          summary: rep.summary,
          details: {
            adherencePercent: rep.adherencePercent,
            daysWithData: rep.daysWithData
          }
        });
        update((s) => ({
          ...s,
          reports: [saved, ...s.reports],
          isLoading: false
        }));
        toastStore.success('Reporte guardado en el servidor');
        return saved;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al guardar reporte');
        throw err;
      }
    },

    async deleteReport(reportId: string) {
      const auth = get(authStore);
      if (!auth.user) return;
      const current = get(reportsStore);
      const prev = current.reports;
      update((s) => ({ ...s, reports: s.reports.filter((r) => r.id !== reportId) }));

      try {
        await repositories.reports.delete(auth.user.username, reportId);
        toastStore.success('Reporte archivado eliminado');
      } catch (err: unknown) {
        update((s) => ({ ...s, reports: prev }));
        toastStore.error((err as Error)?.message || 'Error al eliminar reporte');
      }
    }
  };
}

export const reportsStore = createReportsStore();
