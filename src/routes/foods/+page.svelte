<script lang="ts">
  import { onMount } from 'svelte';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import { currentUser, isAdmin } from '$lib/application/auth/auth.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import RefreshButton from '$lib/ui/components/RefreshButton.svelte';
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

  // Permisos: Determina si el usuario logueado puede editar o eliminar este alimento
  function canModifyFood(food: FoodItem | null): boolean {
    if (!food) return false;
    if ($isAdmin) return true;
    if (!food.ownerUserId) return true;
    const uid = $currentUser?.userId || $currentUser?.id || $currentUser?.username;
    return Boolean(
      uid &&
      (food.ownerUserId === uid ||
        food.ownerUserId === $currentUser?.id ||
        food.ownerUserId === $currentUser?.username ||
        food.ownerUserId === $currentUser?.userId)
    );
  }

  // Delete modal state
  let foodToDelete = $state<FoodItem | null>(null);
  let isDeleteModalOpen = $state(false);
  let isDeletingFood = $state(false);

  function confirmDeleteFood(food: FoodItem) {
    foodToDelete = food;
    isDeleteModalOpen = true;
  }

  async function executeDeleteFood() {
    if (!foodToDelete || isDeletingFood) return;
    const targetFood = foodToDelete;
    isDeletingFood = true;
    try {
      const ok = await foodsStore.deleteFood(targetFood.id);
      if (ok) {
        isDeleteModalOpen = false;
        foodToDelete = null;
      }
    } finally {
      isDeletingFood = false;
    }
  }

  function handleExcludeFromModal() {
    if (!foodToDelete) return;
    foodsStore.toggleExclusion(foodToDelete.id);
    isDeleteModalOpen = false;
    foodToDelete = null;
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

<div class="space-y-6 w-full max-w-full overflow-hidden min-w-0">
  <!-- Header & Primary Action in elevated card -->
  <div
    class="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full max-w-full min-w-0"
  >
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('foods.title')}</h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('foods.subtitle')}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <RefreshButton variant="button" />
      <Button variant="primary" size="sm" onclick={openCreateDrawer}>
        {$t('foods.addFoodBtn')}
      </Button>
    </div>
  </div>

  <!-- Search in elevated card -->
  <div
    class="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-full min-w-0"
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
    <!-- Mobile Card View (< md) -->
    <div class="space-y-3 md:hidden w-full max-w-full min-w-0">
      <!-- Sort Bar on Mobile -->
      <div
        class="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400"
      >
        <span class="font-semibold">{$t('foods.sortBy')}</span>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            onclick={() => toggleSort('name')}
            class="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors {sortField ===
            'name'
              ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}"
          >
            A-Z {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button
            type="button"
            onclick={() => toggleSort('calories')}
            class="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors {sortField ===
            'calories'
              ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}"
          >
            kcal {sortField === 'calories' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
          </button>
          <button
            type="button"
            onclick={() => toggleSort('proteinGrams')}
            class="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors {sortField ===
            'proteinGrams'
              ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}"
          >
            Prot {sortField === 'proteinGrams' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
          </button>
        </div>
      </div>

      {#each filteredFoods as food (food.id)}
        {@const isExcluded = $foodsStore.excludedIds.includes(food.id)}
        {@const canEditOrDelete = canModifyFood(food)}
        <div
          class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 w-full max-w-full min-w-0 {isExcluded
            ? 'opacity-75 bg-red-50/20 dark:bg-red-950/10'
            : ''}"
        >
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-center gap-3 min-w-0">
              <FoodImage src={food.iconOrImageUrl} alt={food.name} size="md" />
              <div class="min-w-0">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight">
                  {food.name}
                </h3>
                {#if food.brand}
                  <p class="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {food.brand}
                  </p>
                {/if}
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              {#if !canEditOrDelete}
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                  title={$t('foods.systemTooltip')}
                >
                  🔒 {$t('foods.systemBadge')}
                </span>
              {/if}
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {formatNumber(food.servingSize)}
                {food.servingUnit}
              </span>
            </div>
          </div>

          <!-- Macros 4 chips -->
          <div
            class="grid grid-cols-4 gap-1.5 text-center bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs"
          >
            <div>
              <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider"
                >Kcal</span
              >
              <span class="font-bold text-amber-600 dark:text-amber-400"
                >{formatNumber(food.calories, 0)}</span
              >
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider"
                >Prot</span
              >
              <span class="font-bold text-blue-600 dark:text-blue-400"
                >{formatGrams(food.proteinGrams)}</span
              >
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider"
                >Carb</span
              >
              <span class="font-bold text-emerald-600 dark:text-emerald-400"
                >{formatGrams(food.carbsGrams)}</span
              >
            </div>
            <div>
              <span class="block text-[10px] text-slate-400 font-medium uppercase tracking-wider"
                >Grasa</span
              >
              <span class="font-bold text-rose-600 dark:text-rose-400"
                >{formatGrams(food.fatsGrams)}</span
              >
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div
            class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80"
          >
            <button
              type="button"
              onclick={() => foodsStore.toggleExclusion(food.id)}
              class="px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors {isExcluded
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}"
              title={$t('foods.toggleExclusion')}
            >
              {isExcluded ? '🚫 Excluido' : '✓ Permitido'}
            </button>

            <div class="flex items-center gap-1">
              {#if canEditOrDelete}
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
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Desktop Data Table (>= md) -->
    <div class="hidden md:block w-full max-w-full min-w-0">
      <Card class="w-full max-w-full overflow-hidden">
        <div class="overflow-x-auto w-full max-w-full rounded-xl">
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
                {@const canEditOrDelete = canModifyFood(food)}
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
                    {#if canEditOrDelete}
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
                    {:else}
                      <span
                        class="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800"
                        title={$t('foods.systemTooltip')}
                      >
                        🔒 {$t('foods.systemBadge')}
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
    title={canModifyFood(foodToDelete)
      ? $t('foods.deleteFoodTitle')
      : $t('foods.cannotDeleteSystemTitle')}
    subtitle={canModifyFood(foodToDelete) ? $t('foods.deleteFoodSubtitle') : ''}
    onclose={cancelDelete}
  >
    <div class="space-y-3">
      {#if canModifyFood(foodToDelete)}
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
      {:else}
        <p class="text-sm text-slate-600 dark:text-slate-300">
          {$t('foods.cannotDeleteSystemDesc')}
        </p>
        <div
          class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-start gap-2"
        >
          <span>ℹ️</span>
          <span>{$t('foods.systemTooltip')}</span>
        </div>
      {/if}
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelDelete}>
          {$t('common.cancel')}
        </Button>
        {#if canModifyFood(foodToDelete)}
          <Button variant="danger" size="sm" onclick={executeDeleteFood} disabled={isDeletingFood}>
            {isDeletingFood ? $t('common.loading') : $t('foods.deleteFoodAction')}
          </Button>
        {:else}
          <Button variant="primary" size="sm" onclick={handleExcludeFromModal}>
            {$t('foods.excludeFoodAction')}
          </Button>
        {/if}
      </div>
    {/snippet}
  </Modal>
</div>
