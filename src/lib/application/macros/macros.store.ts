import { writable } from 'svelte/store';
import type { DailyMacro } from '../../domain/users/UserManagement';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { toastStore } from '../../core/feedback/toast.store';
import { get } from 'svelte/store';
import { getLocalDateStr } from '../../core/utils/format';

export interface MacrosState {
  selectedDate: string;
  currentMacro: DailyMacro | null;
  history: DailyMacro[];
  isLoading: boolean;
  error: string | null;
}

function getTodayStr(): string {
  return getLocalDateStr();
}

function createMacrosStore() {
  const today = getTodayStr();

  const { subscribe, update } = writable<MacrosState>({
    selectedDate: today,
    currentMacro: null,
    history: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    setDate(dateStr: string) {
      update((s) => ({ ...s, selectedDate: dateStr }));
      this.fetchForDate(dateStr);
    },

    async fetchForDate(dateStr: string) {
      const auth = get(authStore);
      if (!auth.user) {
        update((s) => ({ ...s, currentMacro: null, isLoading: false }));
        return;
      }
      const username = auth.user.username;

      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const macro = await repositories.dailyMacros.getByDate(username, dateStr);
        update((s) => ({
          ...s,
          currentMacro: macro,
          isLoading: false
        }));
      } catch (err: unknown) {
        // En caso de error de red o que no exista, dejamos macro en null para empty state
        update((s) => ({
          ...s,
          currentMacro: null,
          isLoading: false,
          error: (err as Error)?.message || 'Error al obtener macros del día'
        }));
      }
    },

    reset() {
      update(() => ({
        selectedDate: getTodayStr(),
        currentMacro: null,
        history: [],
        isLoading: false,
        error: null
      }));
    },

    async fetchHistory(): Promise<DailyMacro[]> {
      const auth = get(authStore);
      if (!auth.user) {
        update((s) => ({ ...s, history: [] }));
        return [];
      }
      const username = auth.user.username;
      try {
        const history = await repositories.dailyMacros.getAll(username);
        history.sort((a, b) => b.date.localeCompare(a.date));
        update((s) => ({ ...s, history }));
        return history;
      } catch {
        return [];
      }
    },

    async saveMacro(dateStr: string, data: Partial<DailyMacro>) {
      const auth = get(authStore);
      const username = auth.user?.username || 'me';

      // Actualización optimista
      const previousMacro = get(macrosStore).currentMacro;
      const optimisticMacro: DailyMacro = {
        date: dateStr,
        userId: auth.user?.id || 'me',
        calories: data.calories ?? previousMacro?.calories ?? 0,
        proteinGrams: data.proteinGrams ?? previousMacro?.proteinGrams ?? 0,
        carbsGrams: data.carbsGrams ?? previousMacro?.carbsGrams ?? 0,
        fatsGrams: data.fatsGrams ?? previousMacro?.fatsGrams ?? 0,
        targetCalories: data.targetCalories ?? previousMacro?.targetCalories ?? 2200,
        targetProteinGrams: data.targetProteinGrams ?? previousMacro?.targetProteinGrams ?? 160,
        targetCarbsGrams: data.targetCarbsGrams ?? previousMacro?.targetCarbsGrams ?? 220,
        targetFatsGrams: data.targetFatsGrams ?? previousMacro?.targetFatsGrams ?? 70
      };

      update((s) => ({ ...s, currentMacro: optimisticMacro }));

      try {
        const saved = await repositories.dailyMacros.create(username, dateStr, optimisticMacro);
        update((s) => ({ ...s, currentMacro: saved }));
        this.fetchHistory();
        toastStore.success('Macros guardados correctamente', 'Éxito');
        return true;
      } catch (err: unknown) {
        // Revertir ante fallo
        update((s) => ({ ...s, currentMacro: previousMacro }));
        toastStore.error(
          (err as Error)?.message || 'No se pudieron guardar los macros en el servidor',
          'Error',
          {
            label: 'Reintentar',
            onClick: () => this.saveMacro(dateStr, data)
          }
        );
        return false;
      }
    },

    async deleteCurrent() {
      const current = get(macrosStore);
      const auth = get(authStore);
      const username = auth.user?.username || 'me';
      const prev = current.currentMacro;

      update((s) => ({ ...s, currentMacro: null }));

      try {
        await repositories.dailyMacros.delete(username, current.selectedDate);
        this.fetchHistory();
        toastStore.success('Registro de macros eliminado', 'Eliminado', {
          label: 'Deshacer',
          onClick: () => {
            if (prev) this.saveMacro(current.selectedDate, prev);
          }
        });
        return true;
      } catch (err: unknown) {
        update((s) => ({ ...s, currentMacro: prev }));
        toastStore.error((err as Error)?.message || 'Error al eliminar registro');
        return false;
      }
    }
  };
}

export const macrosStore = createMacrosStore();
