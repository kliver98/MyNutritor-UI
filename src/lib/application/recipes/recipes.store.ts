import { writable, get } from 'svelte/store';
import type { Recipe, RecipePermissions } from '../../domain/recipes/Recipe';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { toastStore } from '../../core/feedback/toast.store';

export interface RecipesState {
  recipes: Recipe[];
  selectedRecipe: Recipe | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

function createRecipesStore() {
  const { subscribe, update } = writable<RecipesState>({
    recipes: [],
    selectedRecipe: null,
    searchQuery: '',
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    async fetchRecipes(force = false) {
      const auth = get(authStore);
      if (!auth.user) {
        update((s) => ({ ...s, recipes: [], isLoading: false }));
        return;
      }
      const current = get(recipesStore);
      if (!force && current.recipes.length > 0) {
        return;
      }
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const recipes = await repositories.recipes.getAll();
        update((s) => ({ ...s, recipes, isLoading: false }));
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar recetas'
        }));
      }
    },

    reset() {
      update(() => ({
        recipes: [],
        selectedRecipe: null,
        searchQuery: '',
        isLoading: false,
        error: null
      }));
    },

    async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
      update((s) => ({ ...s, isLoading: true }));
      try {
        const created = await repositories.recipes.create(recipe);
        update((s) => ({
          ...s,
          recipes: [created, ...s.recipes],
          isLoading: false
        }));
        toastStore.success(`Receta "${created.title}" creada con éxito`);
        return created;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al guardar receta');
        throw err;
      }
    },

    async updateRecipe(recipeId: string, updates: Partial<Recipe>) {
      try {
        const updated = await repositories.recipes.update(recipeId, updates);
        update((s) => ({
          ...s,
          recipes: s.recipes.map((r) => (r.id === recipeId ? updated : r)),
          selectedRecipe: s.selectedRecipe?.id === recipeId ? updated : s.selectedRecipe
        }));
        toastStore.success('Receta actualizada');
        return updated;
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al actualizar receta');
        throw err;
      }
    },

    async deleteRecipe(recipeId: string) {
      const current = get(recipesStore);
      const prev = current.recipes;
      update((s) => ({ ...s, recipes: s.recipes.filter((r) => r.id !== recipeId) }));

      try {
        await repositories.recipes.delete(recipeId);
        toastStore.success('Receta eliminada');
      } catch (err: unknown) {
        update((s) => ({ ...s, recipes: prev }));
        toastStore.error((err as Error)?.message || 'Error al eliminar receta');
      }
    },

    async updatePermissions(recipeId: string, permissions: RecipePermissions) {
      try {
        const updatedPerms = await repositories.recipes.updatePermissions(recipeId, permissions);
        update((s) => ({
          ...s,
          recipes: s.recipes.map((r) =>
            r.id === recipeId ? { ...r, permissions: updatedPerms } : r
          )
        }));
        toastStore.success('Permisos de receta actualizados');
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al actualizar permisos');
      }
    },

    setSearch(query: string) {
      update((s) => ({ ...s, searchQuery: query }));
    },

    selectRecipe(recipe: Recipe | null) {
      update((s) => ({ ...s, selectedRecipe: recipe }));
    }
  };
}

export const recipesStore = createRecipesStore();
