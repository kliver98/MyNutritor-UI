<script lang="ts">
  import { onMount } from 'svelte';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Drawer from '$lib/ui/components/Drawer.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import FoodImage from '$lib/ui/components/FoodImage.svelte';
  import type { FoodItem } from '$lib/domain/food-items/FoodItem';
  import { formatNumber, formatGrams } from '$lib/core/utils/format';

  let isDrawerOpen = $state(false);
  let editingFood = $state<FoodItem | null>(null);

  // Sorting state (por defecto orden alfabético por nombre ascendente)
  type SortField =
    'name' | 'servingSize' | 'calories' | 'proteinGrams' | 'carbsGrams' | 'fatsGrams';
  type SortDirection = 'asc' | 'desc';

  let sortField = $state<SortField>('name');
  let sortDirection = $state<SortDirection>('asc');

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Delete modal state
  let foodToDelete = $state<FoodItem | null>(null);
  let isDeleteModalOpen = $state(false);

  function confirmDeleteFood(food: FoodItem) {
    foodToDelete = food;
    isDeleteModalOpen = true;
  }

  async function executeDeleteFood() {
    if (!foodToDelete) return;
    const id = foodToDelete.id;
    isDeleteModalOpen = false;
    foodToDelete = null;
    await foodsStore.deleteFood(id);
  }

  function cancelDelete() {
    isDeleteModalOpen = false;
    foodToDelete = null;
  }

  // Form fields con valores por defecto nutricionales (porción 100g, macros en 0)
  let formName = $state('');
  let formBrand = $state('');
  let formServingSize = $state<number | string>(100);
  let formServingUnit = $state('g');
  let formCalories = $state<number | string>(0);
  let formProtein = $state<number | string>(0);
  let formCarbs = $state<number | string>(0);
  let formFats = $state<number | string>(0);
  let formIconOrImageUrl = $state('');

  function autoCalculateCalories() {
    const p = Number(formProtein) || 0;
    const c = Number(formCarbs) || 0;
    const f = Number(formFats) || 0;
    formCalories = Math.round(p * 4 + c * 4 + f * 9);
  }

  onMount(() => {
    foodsStore.fetchFoods();
    foodsStore.fetchExclusions();
  });

  const filteredFoods = $derived.by(() => {
    const query = $foodsStore.searchQuery.trim().toLowerCase();
    const list = $foodsStore.items.filter((item) => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        Boolean(item.brand && item.brand.toLowerCase().includes(query))
      );
    });

    return [...list].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          break;
        case 'servingSize':
          comparison = (a.servingSize || 0) - (b.servingSize || 0);
          break;
        case 'calories':
          comparison = (a.calories || 0) - (b.calories || 0);
          break;
        case 'proteinGrams':
          comparison = (a.proteinGrams || 0) - (b.proteinGrams || 0);
          break;
        case 'carbsGrams':
          comparison = (a.carbsGrams || 0) - (b.carbsGrams || 0);
          break;
        case 'fatsGrams':
          comparison = (a.fatsGrams || 0) - (b.fatsGrams || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  });

  function openCreateDrawer() {
    editingFood = null;
    formName = '';
    formBrand = '';
    formServingSize = 100;
    formServingUnit = 'g';
    formCalories = 0;
    formProtein = 0;
    formCarbs = 0;
    formFats = 0;
    formIconOrImageUrl = '';
    isDrawerOpen = true;
  }

  function openEditDrawer(food: FoodItem) {
    editingFood = food;
    formName = food.name;
    formBrand = food.brand || '';
    formServingSize = food.servingSize ?? 100;
    formServingUnit = food.servingUnit || 'g';
    formCalories = food.calories ?? 0;
    formProtein = food.proteinGrams ?? 0;
    formCarbs = food.carbsGrams ?? 0;
    formFats = food.fatsGrams ?? 0;
    formIconOrImageUrl = food.iconOrImageUrl || '';
    isDrawerOpen = true;
  }

  async function handleSaveFood(e: SubmitEvent) {
    e.preventDefault();
    const payload = {
      name: formName.trim(),
      brand: formBrand.trim() || undefined,
      servingSize: Number(formServingSize) || 100,
      servingUnit: formServingUnit.trim() || 'g',
      calories: Number(formCalories) || 0,
      proteinGrams: Number(formProtein) || 0,
      carbsGrams: Number(formCarbs) || 0,
      fatsGrams: Number(formFats) || 0,
      iconOrImageUrl: formIconOrImageUrl.trim() || undefined
    };

    if (editingFood) {
      await foodsStore.updateFood(editingFood.id, payload);
    } else {
      await foodsStore.createFood(payload);
    }
    isDrawerOpen = false;
  }
</script>

<div class="space-y-6">
  <!-- Header & Primary Action in elevated card -->
  <div
    class="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('foods.title')}</h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('foods.subtitle')}
      </p>
    </div>
    <Button variant="primary" size="sm" onclick={openCreateDrawer}>
      {$t('foods.addFoodBtn')}
    </Button>
  </div>

  <!-- Search in elevated card -->
  <div
    class="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
  >
    <Input
      placeholder={$t('foods.searchPlaceholder')}
      value={$foodsStore.searchQuery}
      oninput={(e) => foodsStore.setSearch(e.currentTarget.value)}
    />
  </div>

  <!-- Loading State vs Table/List -->
  {#if $foodsStore.isLoading && $foodsStore.items.length === 0}
    <div class="space-y-3">
      <Skeleton height="h-12" />
      <Skeleton height="h-12" />
      <Skeleton height="h-12" />
    </div>
  {:else if filteredFoods.length === 0}
    <EmptyState
      title={$t('foods.emptyTitle')}
      description={$t('foods.emptyDesc')}
      icon="🥑"
      actionLabel={$t('foods.addFoodBtn')}
      onaction={openCreateDrawer}
    />
  {:else}
    <Card>
      <div class="overflow-x-auto rounded-xl">
        <table class="w-full text-left text-sm border-collapse">
          <thead
            class="text-xs uppercase bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
          >
            <tr>
              <th
                class="py-3 px-4 min-w-[220px]"
                aria-sort={sortField === 'name'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('name')}
                  class="group flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.foodHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'name'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th
                class="py-3 px-4 min-w-[100px] whitespace-nowrap"
                aria-sort={sortField === 'servingSize'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('servingSize')}
                  class="group flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.portionHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'servingSize'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'servingSize' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th
                class="py-3 px-4 min-w-[90px] text-right whitespace-nowrap"
                aria-sort={sortField === 'calories'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('calories')}
                  class="group ml-auto flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.caloriesHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'calories'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'calories' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th
                class="py-3 px-4 min-w-[90px] text-right whitespace-nowrap"
                aria-sort={sortField === 'proteinGrams'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('proteinGrams')}
                  class="group ml-auto flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.proteinHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'proteinGrams'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'proteinGrams' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th
                class="py-3 px-4 min-w-[90px] text-right whitespace-nowrap"
                aria-sort={sortField === 'carbsGrams'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('carbsGrams')}
                  class="group ml-auto flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.carbsHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'carbsGrams'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'carbsGrams' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th
                class="py-3 px-4 min-w-[90px] text-right whitespace-nowrap"
                aria-sort={sortField === 'fatsGrams'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined}
              >
                <button
                  type="button"
                  onclick={() => toggleSort('fatsGrams')}
                  class="group ml-auto flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                >
                  <span>{$t('foods.fatsHeader')}</span>
                  <span
                    class="text-xs transition-opacity {sortField === 'fatsGrams'
                      ? 'text-slate-900 dark:text-white opacity-100 font-bold'
                      : 'opacity-30 group-hover:opacity-75'}"
                  >
                    {sortField === 'fatsGrams' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </button>
              </th>
              <th class="py-3 px-4 min-w-[130px] text-center whitespace-nowrap"
                >{$t('foods.exclusionHeader')}</th
              >
              <th class="py-3 px-4 min-w-[110px] text-right whitespace-nowrap"
                >{$t('common.actions')}</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            {#each filteredFoods as food (food.id)}
              {@const isExcluded = $foodsStore.excludedIds.includes(food.id)}
              <tr
                class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors {isExcluded
                  ? 'opacity-60 bg-red-50/20'
                  : ''}"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2.5">
                    <FoodImage src={food.iconOrImageUrl} alt={food.name} size="md" />
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-semibold text-slate-900 dark:text-slate-100"
                          >{food.name}</span
                        >
                        {#if food.brand}
                          <span class="text-xs font-normal text-slate-400">({food.brand})</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                  {formatNumber(food.servingSize)}
                  {food.servingUnit}
                </td>
                <td class="py-3 px-4 text-right font-bold text-amber-600 whitespace-nowrap">
                  {formatNumber(food.calories, 0)}
                </td>
                <td class="py-3 px-4 text-right font-medium text-blue-600 whitespace-nowrap">
                  {formatGrams(food.proteinGrams)}
                </td>
                <td class="py-3 px-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                  {formatGrams(food.carbsGrams)}
                </td>
                <td class="py-3 px-4 text-right font-medium text-rose-600 whitespace-nowrap">
                  {formatGrams(food.fatsGrams)}
                </td>

                <!-- Exclusion Toggle in 1 Click -->
                <td class="py-3 px-4 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onclick={() => foodsStore.toggleExclusion(food.id)}
                    class="p-1.5 rounded-lg border text-xs cursor-pointer transition-colors {isExcluded
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700'}"
                    title={$t('foods.toggleExclusion')}
                    aria-label="Alternar exclusión para {food.name}"
                  >
                    {isExcluded ? '🚫 Excluido' : '✓ Permitido'}
                  </button>
                </td>

                <!-- Edit / Delete Actions -->
                <td class="py-3 px-4 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-1">
                    <Button variant="ghost" size="sm" onclick={() => openEditDrawer(food)}>
                      {$t('common.edit')}
                    </Button>
                    <button
                      type="button"
                      onclick={() => confirmDeleteFood(food)}
                      class="text-red-500 hover:text-red-700 p-1.5 text-xs cursor-pointer transition-colors"
                      title="Eliminar alimento"
                      aria-label="Eliminar alimento {food.name}"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}

  <!-- Add/Edit Drawer -->
  <Drawer
    open={isDrawerOpen}
    title={editingFood ? $t('foods.editFoodTitle') : $t('foods.createFoodTitle')}
    onclose={() => (isDrawerOpen = false)}
  >
    <form id="food-form" onsubmit={handleSaveFood} class="space-y-4">
      <Input
        label={$t('foods.name')}
        placeholder="ej. Salmón a la plancha"
        bind:value={formName}
        required
      />

      <Input
        label={$t('foods.brand')}
        placeholder="ej. Casero / Hacendado"
        bind:value={formBrand}
      />

      <div class="grid grid-cols-2 gap-2">
        <Input
          label={$t('foods.servingSize')}
          type="number"
          placeholder="100"
          bind:value={formServingSize}
          required
        />
        <Input
          label={$t('foods.servingUnit')}
          placeholder="g"
          bind:value={formServingUnit}
          required
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label
            for="food-calories-input"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {$t('dashboard.calories')} (kcal) <span class="text-red-500">*</span>
          </label>
          <button
            type="button"
            onclick={autoCalculateCalories}
            class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer flex items-center gap-1"
            title={$t('foods.calcFromMacrosTitle')}
          >
            <span>{$t('foods.calcFromMacros')}</span>
          </button>
        </div>
        <Input
          id="food-calories-input"
          type="number"
          placeholder="0"
          bind:value={formCalories}
          required
        />
      </div>

      <div class="grid grid-cols-3 gap-2">
        <Input
          label="{$t('dashboard.protein')} (g)"
          type="number"
          placeholder="0"
          bind:value={formProtein}
          required
        />
        <Input
          label="{$t('dashboard.carbs')} (g)"
          type="number"
          placeholder="0"
          bind:value={formCarbs}
          required
        />
        <Input
          label="{$t('dashboard.fats')} (g)"
          type="number"
          placeholder="0"
          bind:value={formFats}
          required
        />
      </div>

      <!-- Imagen o Icono con Vista Previa en Vivo -->
      <div class="space-y-1.5 pt-1">
        <label
          for="food-image-input"
          class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {$t('foods.imageLabel')}
        </label>
        <div class="flex items-center gap-3">
          <FoodImage
            src={formIconOrImageUrl}
            alt={formName || 'Vista previa'}
            size="lg"
            class="shadow-xs"
          />
          <div class="flex-1">
            <Input
              id="food-image-input"
              placeholder="https://... o un emoji ej. 🥑 (vacío = 🥦)"
              bind:value={formIconOrImageUrl}
            />
          </div>
        </div>
        <p class="text-[11px] text-slate-400">
          {$t('foods.imageHelp')}
        </p>
      </div>
    </form>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isDrawerOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button type="submit" form="food-form" variant="primary" size="sm">
        {$t('common.confirm')}
      </Button>
    {/snippet}
  </Drawer>

  <!-- Delete Food Confirmation Modal -->
  <Modal
    open={isDeleteModalOpen}
    title={$t('foods.deleteFoodTitle')}
    subtitle={$t('foods.deleteFoodSubtitle')}
    onclose={cancelDelete}
  >
    <div class="space-y-3">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {$t('foods.deleteFoodQuestion', { name: foodToDelete?.name || '' })}
      </p>
      {#if foodToDelete?.brand}
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {$t('foods.brand')}:
          <span class="font-medium text-slate-700 dark:text-slate-300">{foodToDelete.brand}</span>
        </p>
      {/if}
      <div
        class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2"
      >
        <span>⚠️</span>
        <span>{$t('foods.deleteFoodWarning')}</span>
      </div>
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelDelete}>
          {$t('common.cancel')}
        </Button>
        <Button variant="danger" size="sm" onclick={executeDeleteFood}
          >{$t('foods.deleteFoodAction')}</Button
        >
      </div>
    {/snippet}
  </Modal>
</div>
