<script lang="ts">
  import Modal from '$lib/ui/components/Modal.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import DailyImpactSummary from './DailyImpactSummary.svelte';
  import MealItemsList from './MealItemsList.svelte';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { recipesStore } from '$lib/application/recipes/recipes.store';
  import { foodLogsStore } from '$lib/application/reports/food-logs.store';
  import type { MealBreakdownItem } from '$lib/domain/reports/MealReportFormat';
  import type { FoodItem } from '$lib/domain/food-items/FoodItem';
  import { getLocalDateStr, roundToDecimals } from '$lib/core/utils/format';

  interface Props {
    open: boolean;
    onclose: () => void;
    onmealadded?: () => void;
  }

  let { open = false, onclose, onmealadded }: Props = $props();

  let dishTitle = $state('');
  let formDate = $state(getLocalDateStr());
  let formTime = $state('12:30');
  let isSaving = $state(false);

  // Alimentos agregados al plato con sus bases por gramo
  interface ExtendedItem extends MealBreakdownItem {
    basePerGram: { cal: number; p: number; g: number; c: number };
  }
  let dishItems = $state<ExtendedItem[]>([]);

  // Búsqueda de alimentos y recetas
  let foodSearch = $state('');
  let selectedRecipeId = $state('');

  $effect(() => {
    if (open) {
      formDate = getLocalDateStr();
      const now = new Date();
      formTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Carga perezosa (lazy load): solo si el modal está abierto y los datos no están en memoria
      if ($foodsStore.items.length === 0) foodsStore.fetchFoods();
      if ($recipesStore.recipes.length === 0) recipesStore.fetchRecipes();
    }
  });

  const filteredFoods = $derived(
    foodSearch.trim()
      ? $foodsStore.items
          .filter(
            (f) =>
              f.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
              (f.brand && f.brand.toLowerCase().includes(foodSearch.toLowerCase()))
          )
          .slice(0, 6)
      : []
  );

  function addFoodToDish(food: FoodItem) {
    const serving = food.servingSize || 100;
    const basePerGram = {
      cal: food.calories / serving,
      p: food.proteinGrams / serving,
      g: food.fatsGrams / serving,
      c: food.carbsGrams / serving
    };

    dishItems = [
      ...dishItems,
      {
        name: food.name,
        brand: food.brand || 'General Promedio',
        amount: serving,
        unit: food.servingUnit || 'g',
        calories: Math.round(food.calories),
        proteinGrams: roundToDecimals(food.proteinGrams, 1),
        fatsGrams: roundToDecimals(food.fatsGrams, 1),
        carbsGrams: roundToDecimals(food.carbsGrams, 1),
        basePerGram
      }
    ];
    foodSearch = '';
  }

  function handleLoadRecipe() {
    if (!selectedRecipeId) return;
    const recipe = $recipesStore.recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return;

    if (!dishTitle.trim()) dishTitle = recipe.title;

    const newItems: ExtendedItem[] = recipe.ingredients.map((ing) => {
      const match = $foodsStore.items.find(
        (f) =>
          (ing.foodItemId && f.id === ing.foodItemId) ||
          f.name.toLowerCase() === ing.name.toLowerCase()
      );
      const amount = ing.amount || 100;
      const basePerGram = match
        ? {
            cal: match.calories / (match.servingSize || 100),
            p: match.proteinGrams / (match.servingSize || 100),
            g: match.fatsGrams / (match.servingSize || 100),
            c: match.carbsGrams / (match.servingSize || 100)
          }
        : {
            cal: recipe.macros.caloriesPerServing / (recipe.servings || 1) / (amount || 100),
            p: recipe.macros.proteinGrams / (recipe.servings || 1) / (amount || 100),
            g: recipe.macros.fatsGrams / (recipe.servings || 1) / (amount || 100),
            c: recipe.macros.carbsGrams / (recipe.servings || 1) / (amount || 100)
          };

      return {
        name: ing.name,
        brand: match?.brand || 'Receta',
        amount,
        unit: ing.unit || 'g',
        calories: Math.round(amount * basePerGram.cal),
        proteinGrams: roundToDecimals(amount * basePerGram.p, 1),
        fatsGrams: roundToDecimals(amount * basePerGram.g, 1),
        carbsGrams: roundToDecimals(amount * basePerGram.c, 1),
        basePerGram
      };
    });

    dishItems = [...dishItems, ...newItems];
    selectedRecipeId = '';
  }

  function handleUpdateAmount(index: number, newAmount: number) {
    if (index < 0 || index >= dishItems.length) return;
    const it = dishItems[index];
    const amount = Math.max(1, newAmount);
    dishItems[index] = {
      ...it,
      amount,
      calories: Math.round(amount * it.basePerGram.cal),
      proteinGrams: roundToDecimals(amount * it.basePerGram.p, 1),
      fatsGrams: roundToDecimals(amount * it.basePerGram.g, 1),
      carbsGrams: roundToDecimals(amount * it.basePerGram.c, 1)
    };
  }

  function handleRemoveItem(index: number) {
    dishItems = dishItems.filter((_, i) => i !== index);
  }

  // Totales calculados de esta comida
  const mealCalories = $derived(dishItems.reduce((s, i) => s + (i.calories || 0), 0));
  const mealProtein = $derived(
    roundToDecimals(
      dishItems.reduce((s, i) => s + (i.proteinGrams || 0), 0),
      1
    )
  );
  const mealCarbs = $derived(
    roundToDecimals(
      dishItems.reduce((s, i) => s + (i.carbsGrams || 0), 0),
      1
    )
  );
  const mealFats = $derived(
    roundToDecimals(
      dishItems.reduce((s, i) => s + (i.fatsGrams || 0), 0),
      1
    )
  );

  async function handleSaveMeal() {
    if (!dishTitle.trim() || dishItems.length === 0 || isSaving) return;
    isSaving = true;

    const ok = await foodLogsStore.registerMeal({
      title: dishTitle.trim(),
      date: formDate,
      time: formTime || '12:00',
      items: dishItems,
      calculatedMacros: {
        calories: mealCalories,
        proteinGrams: mealProtein,
        carbsGrams: mealCarbs,
        fatsGrams: mealFats
      }
    });

    isSaving = false;
    if (ok) {
      dishTitle = '';
      dishItems = [];
      onmealadded?.();
      onclose();
    }
  }
</script>

<Modal
  {open}
  title="Registrar Comida"
  subtitle="Selecciona alimentos y recetas para calcular automáticamente el plato y su impacto en el día"
  maxWidthClass="max-w-4xl"
  {onclose}
>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 min-w-0">
    <!-- Columna Izquierda: Formulario y Alimentos del Plato -->
    <div class="lg:col-span-7 space-y-4 min-w-0">
      <!-- Título de la comida con sugerencias rápidas -->
      <div class="space-y-1.5 min-w-0">
        <label for="dish-title" class="text-xs font-bold text-slate-700 dark:text-slate-300">
          Título del Plato o Comida *
        </label>
        <Input
          id="dish-title"
          placeholder="ej. Desayuno, Almuerzo, comida, Bowl de proteína..."
          bind:value={dishTitle}
          required
        />
        <div class="flex items-center gap-1.5 flex-wrap">
          {#each ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'comida'] as tag}
            <button
              type="button"
              onclick={() => (dishTitle = tag)}
              class="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>

      <!-- Fecha y Hora -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
        <div class="space-y-1 min-w-0">
          <label for="form-date" class="text-xs font-bold text-slate-700 dark:text-slate-300"
            >Fecha</label
          >
          <Input id="form-date" type="date" bind:value={formDate} required />
        </div>
        <div class="space-y-1 min-w-0">
          <label for="form-time" class="text-xs font-bold text-slate-700 dark:text-slate-300"
            >Hora</label
          >
          <Input id="form-time" type="time" bind:value={formTime} required />
        </div>
      </div>

      <!-- Selectores de Alimentos y Recetas -->
      <div
        class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3 min-w-0 overflow-hidden"
      >
        <!-- Selector de Recetas -->
        {#if $recipesStore.recipes.length > 0}
          <div class="space-y-1 min-w-0">
            <label
              for="recipe-select"
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block"
            >
              📖 Cargar desde una Receta (agrega todos sus ingredientes)
            </label>
            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center min-w-0">
              <select
                id="recipe-select"
                bind:value={selectedRecipeId}
                class="w-full min-w-0 flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white truncate"
              >
                <option value="">Selecciona una receta guardada...</option>
                {#each $recipesStore.recipes as rec}
                  <option value={rec.id}>{rec.title} ({rec.ingredients.length} ing.)</option>
                {/each}
              </select>
              <Button
                size="sm"
                variant="outline"
                onclick={handleLoadRecipe}
                disabled={!selectedRecipeId}
                class="w-full sm:w-auto shrink-0 justify-center"
              >
                Cargar
              </Button>
            </div>
          </div>
        {/if}

        <!-- Buscador de Alimentos -->
        <div class="space-y-1 relative">
          <label
            for="food-search-input"
            class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block"
          >
            🔍 Buscar y Agregar Alimento
          </label>
          <Input
            id="food-search-input"
            placeholder="Buscar por nombre o marca (ej. Huevo, Tomate, Arepa...)"
            bind:value={foodSearch}
          />
          {#if filteredFoods.length > 0}
            <div
              class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
            >
              {#each filteredFoods as food}
                <button
                  type="button"
                  onclick={() => addFoodToDish(food)}
                  class="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                >
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white">{food.name}</span>
                    <span class="text-slate-400 text-[10px] ml-1">({food.brand || 'General'})</span>
                  </div>
                  <span class="font-mono text-slate-500 font-semibold"
                    >{food.calories} kcal / {food.servingSize}{food.servingUnit}</span
                  >
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Lista de Alimentos Agregados -->
      <MealItemsList
        items={dishItems}
        onupdateamount={handleUpdateAmount}
        onremove={handleRemoveItem}
      />
    </div>

    <!-- Columna Derecha (Abajo en Móvil): Resumen del Día con esta Comida -->
    <div class="lg:col-span-5 flex flex-col justify-between space-y-4">
      <div class="space-y-4">
        <!-- Resumen de la comida sola -->
        <div
          class="p-3 bg-brand-50/60 dark:bg-brand-950/30 rounded-xl border border-brand-200 dark:border-brand-900/60"
        >
          <p
            class="text-[11px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-1"
          >
            Total Estimado de esta Comida
          </p>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-black text-slate-900 dark:text-white">
              {mealCalories} <span class="text-xs font-normal text-slate-500">kcal</span>
            </span>
            <div class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 space-x-2">
              <span class="text-blue-600 dark:text-blue-400">P: {mealProtein}g</span>
              <span class="text-purple-600 dark:text-purple-400">G: {mealFats}g</span>
              <span class="text-emerald-600 dark:text-emerald-400">C: {mealCarbs}g</span>
            </div>
          </div>
        </div>

        <!-- Componente de impacto acumulado en el día -->
        <DailyImpactSummary
          selectedDate={formDate}
          {mealCalories}
          {mealProtein}
          {mealCarbs}
          {mealFats}
        />
      </div>

      <!-- Acciones del Modal -->
      <div
        class="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800"
      >
        <Button variant="outline" size="sm" onclick={onclose} disabled={isSaving}>Cancelar</Button>
        <Button
          variant="primary"
          size="sm"
          onclick={handleSaveMeal}
          disabled={!dishTitle.trim() || dishItems.length === 0 || isSaving}
        >
          {isSaving ? 'Guardando...' : '💾 Registrar Comida'}
        </Button>
      </div>
    </div>
  </div>
</Modal>
