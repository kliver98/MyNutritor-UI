import { writable, derived, get } from 'svelte/store';
import type {
  FoodLogItem,
  DayFoodLogGroup,
  FoodLogDateRangePreset
} from '../../domain/reports/FoodLog';
import type { DailyMacro, UserReport } from '../../domain/users/UserManagement';
import {
  parseReportTimestamp,
  formatReportTimestamp,
  generateMealReportMarkdown,
  type MealBreakdownItem,
  type MealNutritionalSummary
} from '../../domain/reports/MealReportFormat';
import { authStore } from '../auth/auth.store';
import { reportsStore } from './reports.store';
import { repositories } from '../../infrastructure/container';
import { toastStore } from '../../core/feedback/toast.store';
import { getPresetStartDate } from '../../core/utils/calendar';
import {
  getLocalDateStr,
  getPastDateStr,
  formatFullDayDate,
  validateDateRange,
  roundToDecimals
} from '../../core/utils/format';
import { loadSavedLogs, persistLogs, createEntryForDailyMacro } from './food-logs-helpers';

export interface FoodLogsState {
  items: FoodLogItem[];
  preset: FoodLogDateRangePreset;
  startDate: string;
  endDate: string;
  validationError: string | null;
  isLoading: boolean;
}

function createFoodLogsStore() {
  const initialEnd = getLocalDateStr();
  const initialStart = getPresetStartDate(initialEnd, 7);

  const { subscribe, update } = writable<FoodLogsState>({
    items: [],
    preset: '7',
    startDate: initialStart,
    endDate: initialEnd,
    validationError: null,
    isLoading: false
  });

  return {
    subscribe,

    syncWithHistory(dailyMacros: DailyMacro[], serverReports: UserReport[] = []) {
      const auth = get(authStore);
      const username = auth.user?.username || 'user';
      // Cargar logs locales limpiando cualquier ítem automático ficticio previo
      const stored = loadSavedLogs(username).filter((s) => !s.id.startsWith('auto-'));

      // 1. Mapear reportes reales de Firestore users/{username}/reports a FoodLogItem
      const reportItems: FoodLogItem[] = serverReports.map((rep) => {
        const ts = parseReportTimestamp(rep.timestamp || rep.generatedAt);
        const totalAmount =
          rep.items && rep.items.length > 0
            ? rep.items.reduce((acc, it) => acc + (it.amount || 0), 0)
            : 1;

        return {
          id: rep.id,
          date: ts.date || rep.periodStart || getLocalDateStr(),
          time: ts.time,
          title: rep.title || 'Comida Registrada',
          amount: totalAmount,
          unit: rep.items && rep.items.length > 0 ? rep.items[0].unit || 'g' : 'porción',
          calories: rep.summary.averageCalories,
          proteinGrams: rep.summary.averageProtein,
          carbsGrams: rep.summary.averageCarbs,
          fatsGrams: rep.summary.averageFats,
          rawMarkdown: rep.fullContent,
          items: rep.items
        };
      });

      // 2. Combinar con registros locales evitando duplicados
      const existingIds = new Set(reportItems.map((r) => r.id));
      const nonDuplicateStored = stored.filter((s) => !existingIds.has(s.id));
      const combined = [...reportItems, ...nonDuplicateStored];

      // 3. Fallback: únicamente para días que tengan dailyMacros pero ningún reporte registrado
      // Se utiliza createEntryForDailyMacro con time: '' para NO inventar horarios ficticios (ej. 08:15)
      const coveredDates = new Set(combined.map((c) => c.date));
      const fallbackEntries: FoodLogItem[] = [];

      for (const macro of dailyMacros) {
        if (!coveredDates.has(macro.date) && macro.calories > 0) {
          const generated = createEntryForDailyMacro(macro);
          fallbackEntries.push(...generated);
        }
      }

      const merged = [...combined, ...fallbackEntries];
      persistLogs(username, merged);
      update((s) => ({ ...s, items: merged }));
    },

    setPreset(preset: '7' | '14' | 'custom') {
      if (preset === 'custom') {
        update((s) => ({
          ...s,
          preset: 'custom'
        }));
        return;
      }
      const end = getLocalDateStr();
      const days = preset === '7' ? 7 : 14;
      const start = getPresetStartDate(end, days);

      update((s) => ({
        ...s,
        preset,
        startDate: start,
        endDate: end,
        validationError: null
      }));
    },

    setCustomRange(start: string, end: string) {
      const validation = validateDateRange(start, end, 60);
      if (!validation.isValid) {
        update((s) => ({
          ...s,
          preset: 'custom',
          startDate: start,
          endDate: end,
          validationError: validation.errorMessage || 'Rango de fechas inválido'
        }));
        return false;
      }

      update((s) => ({
        ...s,
        preset: 'custom',
        startDate: start,
        endDate: end,
        validationError: null
      }));
      return true;
    },

    async registerMeal(params: {
      title: string;
      date: string;
      time: string;
      items: MealBreakdownItem[];
      calculatedMacros: MealNutritionalSummary;
    }): Promise<boolean> {
      const auth = get(authStore);
      const username = auth.user?.username || 'user';
      const { title, date, time, items, calculatedMacros } = params;

      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const markdown = generateMealReportMarkdown({
        title,
        items,
        calculatedMacros
      });
      const timestamp = formatReportTimestamp(date, time);

      const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 100;
      const unit = items[0]?.unit || 'g';

      const newItem: FoodLogItem = {
        id,
        date,
        time,
        title: title.trim() || 'Comida',
        amount: totalAmount,
        unit,
        calories: Math.round(calculatedMacros.calories),
        proteinGrams: roundToDecimals(calculatedMacros.proteinGrams, 2),
        carbsGrams: roundToDecimals(calculatedMacros.carbsGrams, 2),
        fatsGrams: roundToDecimals(calculatedMacros.fatsGrams, 2),
        rawMarkdown: markdown,
        items
      };

      // Optimistic Update
      update((s) => {
        const next = [newItem, ...s.items.filter((i) => i.id !== id)];
        persistLogs(username, next);
        return { ...s, items: next };
      });

      try {
        // Guardar reporte en Firestore users/{username}/reports
        await repositories.reports.create(username, {
          id,
          title: title.trim() || 'Comida',
          timestamp,
          fullContent: markdown
        });

        // Actualizar macros acumulados del día
        const repState = get(reportsStore);
        const existingDaily = repState.dailyMacros.find((d) => d.date === date);

        const prevCal = existingDaily?.calories || 0;
        const prevP = existingDaily?.proteinGrams || 0;
        const prevC = existingDaily?.carbsGrams || 0;
        const prevF = existingDaily?.fatsGrams || 0;

        const updatedMacro: Partial<DailyMacro> = {
          date,
          calories: prevCal + Math.round(calculatedMacros.calories),
          proteinGrams: roundToDecimals(prevP + calculatedMacros.proteinGrams, 2),
          carbsGrams: roundToDecimals(prevC + calculatedMacros.carbsGrams, 2),
          fatsGrams: roundToDecimals(prevF + calculatedMacros.fatsGrams, 2),
          targetCalories: existingDaily?.targetCalories || 2200,
          targetProteinGrams: existingDaily?.targetProteinGrams || 160,
          targetCarbsGrams: existingDaily?.targetCarbsGrams || 220,
          targetFatsGrams: existingDaily?.targetFatsGrams || 70
        };

        await repositories.dailyMacros.create(username, date, updatedMacro);
        reportsStore.fetchData();
        toastStore.success('Comida registrada correctamente', 'Éxito');
        return true;
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al guardar la comida en el servidor');
        return false;
      }
    },

    addLog(logData: Omit<FoodLogItem, 'id'>) {
      const auth = get(authStore);
      const username = auth.user?.username || 'user';

      const newItem: FoodLogItem = {
        ...logData,
        id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        calories: Number(logData.calories) || 0,
        proteinGrams: roundToDecimals(logData.proteinGrams, 2),
        carbsGrams: roundToDecimals(logData.carbsGrams, 2),
        fatsGrams: roundToDecimals(logData.fatsGrams, 2)
      };

      update((s) => {
        const next = [newItem, ...s.items];
        persistLogs(username, next);
        return { ...s, items: next };
      });
    },

    deleteLog(id: string) {
      const auth = get(authStore);
      const username = auth.user?.username || 'user';

      update((s) => {
        const next = s.items.filter((item) => item.id !== id);
        persistLogs(username, next);
        return { ...s, items: next };
      });
    },

    reset() {
      update((s) => ({
        ...s,
        items: [],
        preset: '7',
        startDate: getPastDateStr(7),
        endDate: getLocalDateStr(),
        validationError: null
      }));
    }
  };
}

export const foodLogsStore = createFoodLogsStore();

export const groupedFoodLogs = derived(foodLogsStore, ($store) => {
  const { items, startDate, endDate } = $store;
  const inRange = items.filter((item) => item.date >= startDate && item.date <= endDate);

  const groupMap = new Map<string, FoodLogItem[]>();
  for (const item of inRange) {
    const list = groupMap.get(item.date) || [];
    list.push(item);
    groupMap.set(item.date, list);
  }

  const sortedDates = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

  const groups: DayFoodLogGroup[] = sortedDates.map((date) => {
    const dayItems = groupMap.get(date) || [];
    dayItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const totalCalories = dayItems.reduce((acc, cur) => acc + (cur.calories || 0), 0);
    const totalProteinGrams = roundToDecimals(
      dayItems.reduce((acc, cur) => acc + (cur.proteinGrams || 0), 0),
      2
    );
    const totalCarbsGrams = roundToDecimals(
      dayItems.reduce((acc, cur) => acc + (cur.carbsGrams || 0), 0),
      2
    );
    const totalFatsGrams = roundToDecimals(
      dayItems.reduce((acc, cur) => acc + (cur.fatsGrams || 0), 0),
      2
    );

    return {
      date,
      displayDate: formatFullDayDate(date),
      items: dayItems,
      totalCalories,
      totalProteinGrams,
      totalCarbsGrams,
      totalFatsGrams
    };
  });

  return groups;
});

export const foodLogPeriodTotals = derived(groupedFoodLogs, ($groups) => {
  const totalDays = $groups.length;
  const totalItemsCount = $groups.reduce((acc, g) => acc + g.items.length, 0);
  const totalCalories = $groups.reduce((acc, g) => acc + g.totalCalories, 0);
  const totalProtein = roundToDecimals(
    $groups.reduce((acc, g) => acc + g.totalProteinGrams, 0),
    2
  );
  const totalCarbs = roundToDecimals(
    $groups.reduce((acc, g) => acc + g.totalCarbsGrams, 0),
    2
  );
  const totalFats = roundToDecimals(
    $groups.reduce((acc, g) => acc + g.totalFatsGrams, 0),
    2
  );

  return {
    totalDays,
    totalItemsCount,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats
  };
});
