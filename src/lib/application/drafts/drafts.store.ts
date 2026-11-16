import { writable, get } from 'svelte/store';
import type { MealDraft, DraftPrompt } from '../../domain/users/UserManagement';
import { repositories } from '../../infrastructure/container';
import { authStore } from '../auth/auth.store';
import { macrosStore } from '../macros/macros.store';
import { recipesStore } from '../recipes/recipes.store';
import { toastStore } from '../../core/feedback/toast.store';
import { getLocalDateStr } from '../../core/utils/format';

export interface DraftsState {
  mealDrafts: MealDraft[];
  draftPrompts: DraftPrompt[];
  isLoading: boolean;
  error: string | null;
}

function createDraftsStore() {
  const { subscribe, update } = writable<DraftsState>({
    mealDrafts: [],
    draftPrompts: [],
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    reset() {
      update(() => ({
        mealDrafts: [],
        draftPrompts: [],
        isLoading: false,
        error: null
      }));
    },

    async fetchDrafts() {
      const auth = get(authStore);
      if (!auth.user) return;
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const [mealDrafts, draftPrompts] = await Promise.all([
          repositories.drafts.getMealDrafts(auth.user.username),
          repositories.drafts.getDraftPrompts(auth.user.username)
        ]);
        update((s) => ({ ...s, mealDrafts, draftPrompts, isLoading: false }));
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar borradores'
        }));
      }
    },

    async createMealDraft(draft: Partial<MealDraft>) {
      const auth = get(authStore);
      if (!auth.user) return;
      try {
        const created = await repositories.drafts.createMealDraft(auth.user.username, draft);
        update((s) => ({ ...s, mealDrafts: [created, ...s.mealDrafts] }));
        toastStore.success('Borrador de comida guardado');
        return created;
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al guardar borrador');
        throw err;
      }
    },

    async deleteMealDraft(draftId: string) {
      const auth = get(authStore);
      if (!auth.user) return;
      const prev = get(draftsStore).mealDrafts;
      update((s) => ({ ...s, mealDrafts: s.mealDrafts.filter((d) => d.id !== draftId) }));

      try {
        await repositories.drafts.deleteMealDraft(auth.user.username, draftId);
        toastStore.success('Borrador eliminado');
      } catch (err: unknown) {
        update((s) => ({ ...s, mealDrafts: prev }));
        toastStore.error((err as Error)?.message || 'Error al eliminar');
      }
    },

    async createPrompt(promptText: string) {
      const auth = get(authStore);
      if (!auth.user) return;
      try {
        const created = await repositories.drafts.createDraftPrompt(auth.user.username, promptText);
        update((s) => ({ ...s, draftPrompts: [created, ...s.draftPrompts] }));
        toastStore.success('Consulta guardada');
        return created;
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al enviar consulta');
        throw err;
      }
    },

    async deletePrompt(promptId: string) {
      const auth = get(authStore);
      if (!auth.user) return;
      const prev = get(draftsStore).draftPrompts;
      update((s) => ({ ...s, draftPrompts: s.draftPrompts.filter((p) => p.id !== promptId) }));

      try {
        await repositories.drafts.deleteDraftPrompt(auth.user.username, promptId);
        toastStore.success('Prompt eliminado');
      } catch (err: unknown) {
        update((s) => ({ ...s, draftPrompts: prev }));
        toastStore.error((err as Error)?.message || 'Error al eliminar prompt');
      }
    },

    async convertToDailyMacro(draft: MealDraft) {
      const today = getLocalDateStr();
      const cal = draft.estimatedCalories || 350;
      await macrosStore.saveMacro(today, {
        calories: (get(macrosStore).currentMacro?.calories || 0) + cal
      });
      toastStore.success(`"${draft.title}" registrado en tus macros de hoy (+${cal} kcal)`);
    },

    async convertToRecipe(draft: MealDraft) {
      const auth = get(authStore);
      await recipesStore.createRecipe({
        title: draft.title,
        description: `Creada a partir del borrador de ${draft.mealType}`,
        servings: 1,
        ingredients: draft.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit
        })),
        instructions: ['Preparar y disfrutar.'],
        macros: {
          caloriesPerServing: draft.estimatedCalories || 300,
          proteinGrams: 25,
          carbsGrams: 30,
          fatsGrams: 10
        },
        authorId: auth.user?.id || 'me',
        permissions: { isPublic: false, sharedWithUserIds: [] }
      });
      toastStore.success(`Receta "${draft.title}" creada en tu recetario`);
    }
  };
}

export const draftsStore = createDraftsStore();
