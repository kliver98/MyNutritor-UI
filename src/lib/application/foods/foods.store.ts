import { writable, get } from 'svelte/store';
import type { FoodItem } from '../../domain/food-items/FoodItem';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { toastStore } from '../../core/feedback/toast.store';

export interface FoodsState {
  items: FoodItem[];
  excludedIds: string[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

function createFoodsStore() {
  const { subscribe, update } = writable<FoodsState>({
    items: [],
    excludedIds: [],
    searchQuery: '',
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    async fetchFoods() {
      const auth = get(authStore);
      if (!auth.user) {
        update((s) => ({ ...s, items: [], isLoading: false }));
        return;
      }
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const items = await repositories.foodItems.getAll();
        update((s) => ({ ...s, items, isLoading: false }));
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar catálogo de alimentos'
        }));
      }
    },

    reset() {
      update(() => ({
        items: [],
        excludedIds: [],
        searchQuery: '',
        isLoading: false,
        error: null
      }));
    },

    async fetchExclusions() {
      const auth = get(authStore);
      if (!auth.user) return;
      try {
        const exclusions = await repositories.userSettings.getFoodExclusions(auth.user.username);
        update((s) => ({ ...s, excludedIds: exclusions.excludedFoodIds || [] }));
      } catch {
        // Exclusiones vacías o error silencioso
      }
    },

    async toggleExclusion(foodId: string) {
      const auth = get(authStore);
      if (!auth.user) {
        toastStore.warning('Inicia sesión para guardar exclusiones de alimentos');
        return;
      }

      const current = get(foodsStore);
      const isAlreadyExcluded = current.excludedIds.includes(foodId);
      const nextExcluded = isAlreadyExcluded
        ? current.excludedIds.filter((id) => id !== foodId)
        : [...current.excludedIds, foodId];

      // Optimistic update
      update((s) => ({ ...s, excludedIds: nextExcluded }));

      try {
        await repositories.userSettings.updateFoodExclusions(auth.user.username, {
          userId: auth.user.id,
          excludedFoodIds: nextExcluded
        });
        toastStore.success(
          isAlreadyExcluded ? 'Alimento readmitido en tu dieta' : 'Alimento excluido de tu dieta'
        );
      } catch (err: unknown) {
        // Revertir
        update((s) => ({ ...s, excludedIds: current.excludedIds }));
        toastStore.error((err as Error)?.message || 'Error al actualizar exclusiones');
      }
    },

    async createFood(food: Omit<FoodItem, 'id'>) {
      update((s) => ({ ...s, isLoading: true }));
      try {
        const created = await repositories.foodItems.create(food);
        update((s) => ({ ...s, items: [created, ...s.items], isLoading: false }));
        toastStore.success(`Alimento "${created.name}" agregado con éxito`);
        return created;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al crear alimento');
        throw err;
      }
    },

    async updateFood(foodId: string, updates: Partial<FoodItem>) {
      try {
        const updated = await repositories.foodItems.update(foodId, updates);
        update((s) => ({
          ...s,
          items: s.items.map((item) => (item.id === foodId ? updated : item))
        }));
        toastStore.success(`Alimento "${updated.name}" actualizado`);
        return updated;
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al actualizar alimento');
        throw err;
      }
    },

    async deleteFood(foodId: string): Promise<boolean> {
      const current = get(foodsStore);
      const prevItems = current.items;
      update((s) => ({ ...s, items: s.items.filter((item) => item.id !== foodId) }));

      try {
        await repositories.foodItems.delete(foodId);
        toastStore.success('Alimento eliminado');
        return true;
      } catch (err: unknown) {
        update((s) => ({ ...s, items: prevItems }));
        toastStore.error((err as Error)?.message || 'Error al eliminar alimento');
        return false;
      }
    },

    setSearch(query: string) {
      update((s) => ({ ...s, searchQuery: query }));
    }
  };
}

export const foodsStore = createFoodsStore();
