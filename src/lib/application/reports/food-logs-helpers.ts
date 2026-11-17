import type { FoodLogItem } from '../../domain/reports/FoodLog';
import type { DailyMacro } from '../../domain/users/UserManagement';
import { roundToDecimals } from '../../core/utils/format';

const STORAGE_KEY_PREFIX = 'mynutritor_food_logs_';

export function getStorageKey(username: string): string {
  return `${STORAGE_KEY_PREFIX}${username}`;
}

export function loadSavedLogs(username: string): FoodLogItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(username));
    if (!raw) return [];
    const items = JSON.parse(raw) as FoodLogItem[];
    // Limpiar antiguos registros automáticos o con horarios ficticios antiguos
    return items.filter(
      (it) =>
        !it.id.startsWith('auto-') &&
        !it.id.startsWith('mock-') &&
        it.time !== '08:15' &&
        it.time !== '13:30' &&
        it.time !== '20:00'
    );
  } catch {
    return [];
  }
}

export function persistLogs(username: string, items: FoodLogItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Solo persistir registros no-auto
    const toPersist = items.filter((it) => !it.id.startsWith('auto-'));
    window.localStorage.setItem(getStorageKey(username), JSON.stringify(toPersist));
  } catch {
    // Ignorar si el almacenamiento local está lleno o bloqueado
  }
}

/**
 * Crea una entrada para días con macros en el backend cuando no existen reportes detallados,
 * utilizando únicamente los datos reales y sin inventar horarios ficticios (time queda vacío o '--:--').
 */
export function createEntryForDailyMacro(macro: DailyMacro): FoodLogItem[] {
  if (!macro.calories || macro.calories <= 0) return [];

  return [
    {
      id: `macro-${macro.date}`,
      date: macro.date,
      time: '', // Sin horario genérico inventado
      title: 'Consumo Diario Acumulado',
      amount: 1,
      unit: 'día',
      calories: Math.round(macro.calories),
      proteinGrams: roundToDecimals(macro.proteinGrams, 1),
      carbsGrams: roundToDecimals(macro.carbsGrams, 1),
      fatsGrams: roundToDecimals(macro.fatsGrams, 1)
    }
  ];
}
