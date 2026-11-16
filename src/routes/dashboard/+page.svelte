<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { macrosStore } from '$lib/application/macros/macros.store';
  import { currentUser } from '$lib/application/auth/auth.store';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Drawer from '$lib/ui/components/Drawer.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import MacroCard from '$lib/ui/features/dashboard/MacroCard.svelte';
  import DateSelector from '$lib/ui/features/dashboard/DateSelector.svelte';
  import { getLocalDateStr } from '$lib/core/utils/format';

  let isQuickAddOpen = $state(false);

  // Form states for quick log drawer (no working defaults, clean placeholders)
  let formCalories = $state<number | string>('');
  let formProtein = $state<number | string>('');
  let formCarbs = $state<number | string>('');
  let formFats = $state<number | string>('');

  function getTodayStr(): string {
    return getLocalDateStr();
  }

  onMount(() => {
    macrosStore.fetchForDate($macrosStore.selectedDate || getTodayStr());
    macrosStore.fetchHistory();
    foodsStore.fetchFoods();
  });

  async function handleSaveQuickAdd(e: SubmitEvent) {
    e.preventDefault();
    const ok = await macrosStore.saveMacro($macrosStore.selectedDate, {
      calories: ($macrosStore.currentMacro?.calories || 0) + (Number(formCalories) || 0),
      proteinGrams: ($macrosStore.currentMacro?.proteinGrams || 0) + (Number(formProtein) || 0),
      carbsGrams: ($macrosStore.currentMacro?.carbsGrams || 0) + (Number(formCarbs) || 0),
      fatsGrams: ($macrosStore.currentMacro?.fatsGrams || 0) + (Number(formFats) || 0)
    });

    if (ok) {
      isQuickAddOpen = false;
      formCalories = '';
      formProtein = '';
      formCarbs = '';
      formFats = '';
    }
  }

  function handleDeleteCurrent() {
    if (confirm('¿Deseas eliminar el registro nutricional de este día?')) {
      macrosStore.deleteCurrent();
    }
  }

  // Targets and current values
  const targetCalories = $derived($macrosStore.currentMacro?.targetCalories ?? 2200);
  const targetProtein = $derived($macrosStore.currentMacro?.targetProteinGrams ?? 160);
  const targetCarbs = $derived($macrosStore.currentMacro?.targetCarbsGrams ?? 220);
  const targetFats = $derived($macrosStore.currentMacro?.targetFatsGrams ?? 70);

  const currentCalories = $derived($macrosStore.currentMacro?.calories ?? 0);
  const currentProtein = $derived($macrosStore.currentMacro?.proteinGrams ?? 0);
  const currentCarbs = $derived($macrosStore.currentMacro?.carbsGrams ?? 0);
  const currentFats = $derived($macrosStore.currentMacro?.fatsGrams ?? 0);
</script>

<div class="space-y-6">
  <!-- Top Welcome & Date Bar -->
  <div
    class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
  >
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">
        {$t('dashboard.welcome', {
          name: $currentUser?.fullName || $currentUser?.username || 'Usuario'
        })}
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('dashboard.overviewSubtitle')}
      </p>
    </div>

    <!-- Flexible Date Navigation & Actions -->
    <div class="flex flex-wrap items-center gap-2">
      <DateSelector
        selectedDate={$macrosStore.selectedDate}
        history={$macrosStore.history}
        onselect={(d) => macrosStore.setDate(d)}
      />

      <Button variant="primary" size="sm" onclick={() => (isQuickAddOpen = true)}>
        {$t('dashboard.logMacrosBtn')}
      </Button>
    </div>
  </div>

  <!-- Loading Skeletons vs Data View -->
  {#if $macrosStore.isLoading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Skeleton height="h-32" />
      <Skeleton height="h-32" />
      <Skeleton height="h-32" />
      <Skeleton height="h-32" />
    </div>
  {:else if !$macrosStore.currentMacro && currentCalories === 0}
    <!-- Empty State for Today -->
    <EmptyState
      title={$t('dashboard.noDataToday')}
      description={$t('dashboard.emptyDescription')}
      icon="🥗"
      actionLabel={$t('dashboard.logFirstAction')}
      onaction={() => (isQuickAddOpen = true)}
    />
  {:else}
    <!-- Macro Summary Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MacroCard
        title={$t('dashboard.calories')}
        current={currentCalories}
        target={targetCalories}
        unit={$t('dashboard.kcal')}
        accentColor="amber"
        decimals={0}
      />
      <MacroCard
        title={$t('dashboard.protein')}
        current={currentProtein}
        target={targetProtein}
        unit="g"
        accentColor="blue"
        decimals={2}
      />
      <MacroCard
        title={$t('dashboard.carbs')}
        current={currentCarbs}
        target={targetCarbs}
        unit="g"
        accentColor="emerald"
        decimals={2}
      />
      <MacroCard
        title={$t('dashboard.fats')}
        current={currentFats}
        target={targetFats}
        unit="g"
        accentColor="rose"
        decimals={2}
      />
    </div>

    <!-- Actions bar for current day's record in elevated card for maximum contrast -->
    {#if $macrosStore.currentMacro}
      <div
        class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs"
      >
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
          <span class="font-semibold text-slate-800 dark:text-slate-200">
            {$t('dashboard.activeRecordFor', { date: $macrosStore.selectedDate })}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="secondary" size="sm" onclick={() => (isQuickAddOpen = true)}>
            {$t('dashboard.addMoreConsumption')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onclick={handleDeleteCurrent}
          >
            {$t('dashboard.deleteRecord')}
          </Button>
        </div>
      </div>
    {/if}

    <!-- Fast shortcuts to catalog, recipes & reports -->
    <Card title={$t('dashboard.shortcutsTitle')}>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="{base}/foods"
          class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex items-start gap-3 bg-white dark:bg-slate-900"
        >
          <span class="text-2xl group-hover:scale-110 transition-transform">🥑</span>
          <div>
            <h4
              class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300"
            >
              {$t('nav.foods')}
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">
              {$t('dashboard.shortcutsFoodsDesc')}
            </p>
          </div>
        </a>

        <a
          href="{base}/recipes"
          class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex items-start gap-3 bg-white dark:bg-slate-900"
        >
          <span class="text-2xl group-hover:scale-110 transition-transform">📖</span>
          <div>
            <h4
              class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300"
            >
              {$t('nav.recipes')}
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">
              {$t('dashboard.shortcutsRecipesDesc')}
            </p>
          </div>
        </a>

        <a
          href="{base}/reports"
          class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group flex items-start gap-3 bg-white dark:bg-slate-900"
        >
          <span class="text-2xl group-hover:scale-110 transition-transform">📊</span>
          <div>
            <h4
              class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300"
            >
              {$t('nav.reports')}
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">
              {$t('dashboard.shortcutsReportsDesc')}
            </p>
          </div>
        </a>
      </div>
    </Card>
  {/if}

  <!-- Quick Add Macro Drawer (Inline zero-friction flow) -->
  <Drawer
    open={isQuickAddOpen}
    title={$t('dashboard.quickAddTitle')}
    subtitle={$t('dashboard.quickAddSubtitle')}
    onclose={() => (isQuickAddOpen = false)}
  >
    <form id="quick-add-form" onsubmit={handleSaveQuickAdd} class="space-y-4">
      <Input
        label="{$t('dashboard.calories')} ({$t('dashboard.kcal')})"
        type="number"
        placeholder="ej. 500"
        bind:value={formCalories}
        required
      />

      <div class="grid grid-cols-3 gap-2">
        <Input
          label="{$t('dashboard.protein')} (g)"
          type="number"
          placeholder="ej. 30"
          bind:value={formProtein}
          required
        />
        <Input
          label="{$t('dashboard.carbs')} (g)"
          type="number"
          placeholder="ej. 50"
          bind:value={formCarbs}
          required
        />
        <Input
          label="{$t('dashboard.fats')} (g)"
          type="number"
          placeholder="ej. 15"
          bind:value={formFats}
          required
        />
      </div>
    </form>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isQuickAddOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button
        type="submit"
        form="quick-add-form"
        variant="primary"
        size="sm"
        loading={$macrosStore.isLoading}
      >
        {$t('common.confirm')}
      </Button>
    {/snippet}
  </Drawer>
</div>
