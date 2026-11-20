<script lang="ts">
  import { onMount } from 'svelte';
  import { draftsStore } from '$lib/application/drafts/drafts.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import RefreshButton from '$lib/ui/components/RefreshButton.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Badge from '$lib/ui/components/Badge.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Drawer from '$lib/ui/components/Drawer.svelte';

  let activeTab = $state<'meals' | 'prompts'>('meals');
  let promptInput = $state('');
  let isMealDrawerOpen = $state(false);

  // New meal draft fields (no working defaults, clean placeholders)
  let mealTitle = $state('');
  let mealType = $state<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  let mealCalories = $state<number | string>('');

  onMount(() => {
    draftsStore.fetchDrafts();
  });

  async function handleSendPrompt(e: SubmitEvent) {
    e.preventDefault();
    if (!promptInput.trim()) return;
    await draftsStore.createPrompt(promptInput.trim());
    promptInput = '';
  }

  async function handleSaveMealDraft(e: SubmitEvent) {
    e.preventDefault();
    await draftsStore.createMealDraft({
      title: mealTitle.trim(),
      mealType,
      estimatedCalories: Number(mealCalories) || 0,
      ingredients: []
    });
    isMealDrawerOpen = false;
    mealTitle = '';
    mealCalories = '';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('drafts.title')}</h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('drafts.subtitle')}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <RefreshButton variant="button" />
      <Button variant="primary" size="sm" onclick={() => (isMealDrawerOpen = true)}>
        + Nuevo Borrador
      </Button>
    </div>
  </div>

  <!-- Tabs Switcher -->
  <div
    class="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900 shadow-xs"
  >
    <button
      type="button"
      onclick={() => (activeTab = 'meals')}
      class="px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
      'meals'
        ? 'bg-brand-600 text-white shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
    >
      🥗 {$t('drafts.mealDrafts')} ({$draftsStore.mealDrafts.length})
    </button>
    <button
      type="button"
      onclick={() => (activeTab = 'prompts')}
      class="px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
      'prompts'
        ? 'bg-brand-600 text-white shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
    >
      ✨ {$t('drafts.promptDrafts')} ({$draftsStore.draftPrompts.length})
    </button>
  </div>

  <!-- Tab 1: Meal Drafts -->
  {#if activeTab === 'meals'}
    {#if $draftsStore.mealDrafts.length === 0}
      <EmptyState
        title={$t('drafts.emptyMealsTitle')}
        description={$t('drafts.emptyMealsDesc')}
        icon="🍽️"
        actionLabel="+ Crear Borrador de Comida"
        onaction={() => (isMealDrawerOpen = true)}
      />
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each $draftsStore.mealDrafts as draft (draft.id)}
          <Card title={draft.title}>
            {#snippet headerAction()}
              <Badge variant="brand" size="sm">{draft.mealType}</Badge>
            {/snippet}

            <div class="space-y-2 py-2">
              <p class="text-sm font-semibold text-amber-600">
                ~{draft.estimatedCalories || 350} kcal estimadas
              </p>
              {#if draft.ingredients && draft.ingredients.length > 0}
                <p class="text-xs text-slate-500">
                  {draft.ingredients.map((i) => `${i.name} (${i.amount}${i.unit})`).join(', ')}
                </p>
              {/if}
            </div>

            {#snippet footer()}
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onclick={() => draftsStore.deleteMealDraft(draft.id)}
                  class="text-red-500 hover:text-red-700 cursor-pointer"
                >
                  {$t('common.delete')}
                </button>
                <div class="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => draftsStore.convertToDailyMacro(draft)}
                  >
                    {$t('drafts.convertToMacro')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => draftsStore.convertToRecipe(draft)}
                  >
                    {$t('drafts.convertToRecipe')}
                  </Button>
                </div>
              </div>
            {/snippet}
          </Card>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- Tab 2: Prompt Drafts & AI Query Box -->
    <div class="space-y-5">
      <Card title="Consultar o Guardar Sugerencia IA">
        <form onsubmit={handleSendPrompt} class="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={$t('drafts.newPromptPlaceholder')}
            bind:value={promptInput}
            required
            class="flex-1"
          />
          <Button type="submit" variant="primary" size="md">
            {$t('drafts.sendPromptBtn')}
          </Button>
        </form>
      </Card>

      {#if $draftsStore.draftPrompts.length === 0}
        <EmptyState
          title={$t('drafts.emptyPromptsTitle')}
          description={$t('drafts.emptyPromptsDesc')}
          icon="✨"
        />
      {:else}
        <div class="space-y-3">
          {#each $draftsStore.draftPrompts as prompt (prompt.id)}
            <Card>
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <p class="text-sm font-semibold text-slate-900 dark:text-white">
                    "{prompt.promptText}"
                  </p>
                  {#if prompt.aiSuggestedMeal}
                    <div
                      class="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs"
                    >
                      💡 <strong>Sugerencia IA:</strong>
                      {prompt.aiSuggestedMeal}
                    </div>
                  {/if}
                  <span class="text-[10px] text-slate-400">
                    {new Date(prompt.createdAt).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onclick={() => draftsStore.deletePrompt(prompt.id)}
                  class="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- New Meal Draft Drawer -->
  <Drawer
    open={isMealDrawerOpen}
    title="Nuevo Borrador de Comida"
    onclose={() => (isMealDrawerOpen = false)}
  >
    <form id="new-meal-draft-form" onsubmit={handleSaveMealDraft} class="space-y-4">
      <Input
        label="Título o Nombre de la comida"
        placeholder="ej. Batido proteico con plátano"
        bind:value={mealTitle}
        required
      />

      <div class="space-y-1.5">
        <label for="meal-type-select" class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >Tipo de Comida</label
        >
        <select
          id="meal-type-select"
          bind:value={mealType}
          class="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="breakfast">Desayuno</option>
          <option value="lunch">Almuerzo</option>
          <option value="dinner">Cena</option>
          <option value="snack">Snack / Merienda</option>
        </select>
      </div>

      <Input
        label="Calorías estimadas (kcal)"
        type="number"
        placeholder="ej. 450"
        bind:value={mealCalories}
      />
    </form>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isMealDrawerOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button type="submit" form="new-meal-draft-form" variant="primary" size="sm">
        {$t('common.confirm')}
      </Button>
    {/snippet}
  </Drawer>
</div>
