<script lang="ts">
  import { onMount } from 'svelte';
  import { recipesStore } from '$lib/application/recipes/recipes.store';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { authStore } from '$lib/application/auth/auth.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Badge from '$lib/ui/components/Badge.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Drawer from '$lib/ui/components/Drawer.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import type { Recipe, RecipeIngredient } from '$lib/domain/recipes/Recipe';
  import { formatGrams, formatCalories, formatNumber } from '$lib/core/utils/format';

  let isDrawerOpen = $state(false);
  let isPermissionsModalOpen = $state(false);
  let activeRecipeForPerms = $state<Recipe | null>(null);

  // Delete confirmation modal state
  let recipeToDelete = $state<Recipe | null>(null);
  let isDeleteModalOpen = $state(false);

  function confirmDeleteRecipe(recipe: Recipe) {
    recipeToDelete = recipe;
    isDeleteModalOpen = true;
  }

  async function executeDeleteRecipe() {
    if (!recipeToDelete) return;
    const id = recipeToDelete.id;
    isDeleteModalOpen = false;
    recipeToDelete = null;
    await recipesStore.deleteRecipe(id);
  }

  function cancelDeleteRecipe() {
    isDeleteModalOpen = false;
    recipeToDelete = null;
  }

  // Form states (no working defaults, clean placeholders)
  let formTitle = $state('');
  let formDescription = $state('');
  let formServings = $state<number | string>('');
  let formPrepMins = $state<number | string>('');
  let formCookMins = $state<number | string>('');
  let formIngredients = $state<RecipeIngredient[]>([]);
  let formInstructions = $state<string[]>(['']);
  let formTags = $state('');

  // Ingredient form helpers
  let newIngName = $state('');
  let newIngAmount = $state<number | string>('');
  let newIngUnit = $state('g');

  // Permissions state
  let permsIsPublic = $state(false);
  let permsSharedUser = $state('');
  let permsUsersList = $state<string[]>([]);

  onMount(() => {
    recipesStore.fetchRecipes();
    foodsStore.fetchFoods();
  });

  const filteredRecipes = $derived(
    $recipesStore.recipes.filter(
      (r) =>
        r.title.toLowerCase().includes($recipesStore.searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes($recipesStore.searchQuery.toLowerCase()) ||
        (r.tags &&
          r.tags.some((tag) => tag.toLowerCase().includes($recipesStore.searchQuery.toLowerCase())))
    )
  );

  function openCreateDrawer() {
    formTitle = '';
    formDescription = '';
    formServings = '';
    formPrepMins = '';
    formCookMins = '';
    formIngredients = [];
    formInstructions = [''];
    formTags = '';
    newIngName = '';
    newIngAmount = '';
    isDrawerOpen = true;
  }

  function addIngredient() {
    if (!newIngName.trim()) return;
    formIngredients = [
      ...formIngredients,
      {
        name: newIngName.trim(),
        amount: Number(newIngAmount) || 100,
        unit: newIngUnit
      }
    ];
    newIngName = '';
    newIngAmount = '';
  }

  function removeIngredient(index: number) {
    formIngredients = formIngredients.filter((_, i) => i !== index);
  }

  function addInstructionStep() {
    formInstructions = [...formInstructions, ''];
  }

  function removeInstructionStep(index: number) {
    formInstructions = formInstructions.filter((_, i) => i !== index);
  }

  async function handleSaveRecipe(e: SubmitEvent) {
    e.preventDefault();
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await recipesStore.createRecipe({
      title: formTitle.trim(),
      description: formDescription.trim(),
      servings: Number(formServings) || 1,
      prepTimeMinutes: Number(formPrepMins) || 0,
      cookTimeMinutes: Number(formCookMins) || 0,
      ingredients: formIngredients,
      instructions: formInstructions.filter(Boolean),
      macros: {
        caloriesPerServing: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatsGrams: 0
      },
      authorId: $authStore.user?.id || 'me',
      authorUsername: $authStore.user?.username || 'me',
      permissions: { isPublic: false, sharedWithUserIds: [] },
      tags: tagsArray
    });

    isDrawerOpen = false;
  }

  function openPermissionsModal(recipe: Recipe) {
    activeRecipeForPerms = recipe;
    permsIsPublic = recipe.permissions?.isPublic ?? false;
    permsUsersList = [...(recipe.permissions?.sharedWithUserIds || [])];
    permsSharedUser = '';
    isPermissionsModalOpen = true;
  }

  function addSharedUser() {
    if (!permsSharedUser.trim()) return;
    if (!permsUsersList.includes(permsSharedUser.trim())) {
      permsUsersList = [...permsUsersList, permsSharedUser.trim()];
    }
    permsSharedUser = '';
  }

  function removeSharedUser(user: string) {
    permsUsersList = permsUsersList.filter((u) => u !== user);
  }

  async function savePermissions() {
    if (!activeRecipeForPerms) return;
    await recipesStore.updatePermissions(activeRecipeForPerms.id, {
      isPublic: permsIsPublic,
      sharedWithUserIds: permsUsersList
    });
    isPermissionsModalOpen = false;
  }
</script>

<div class="space-y-6">
  <!-- Header in elevated card -->
  <div
    class="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('recipes.title')}</h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('recipes.subtitle')}
      </p>
    </div>
    <Button variant="primary" size="sm" onclick={openCreateDrawer}>
      {$t('recipes.createRecipeBtn')}
    </Button>
  </div>

  <!-- Search Filter in elevated card -->
  <div
    class="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
  >
    <Input
      placeholder={$t('recipes.searchPlaceholder')}
      value={$recipesStore.searchQuery}
      oninput={(e) => recipesStore.setSearch(e.currentTarget.value)}
    />
  </div>

  <!-- Recipe Cards Grid -->
  {#if $recipesStore.isLoading && $recipesStore.recipes.length === 0}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Skeleton height="h-48" />
      <Skeleton height="h-48" />
    </div>
  {:else if filteredRecipes.length === 0}
    <EmptyState
      title={$t('recipes.emptyTitle')}
      description={$t('recipes.emptyDesc')}
      icon="📖"
      actionLabel={$t('recipes.createRecipeBtn')}
      onaction={openCreateDrawer}
    />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each filteredRecipes as rec (rec.id)}
        <Card title={rec.title} subtitle={rec.description}>
          {#snippet headerAction()}
            <button
              type="button"
              onclick={() => openPermissionsModal(rec)}
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5"
              title="Permisos y Colaboradores"
            >
              <span>{rec.permissions?.isPublic ? '🌐' : '🔒'}</span>
              <span class="hidden sm:inline">Permisos</span>
            </button>
          {/snippet}

          <!-- Tags -->
          {#if rec.tags && rec.tags.length > 0}
            <div class="flex flex-wrap gap-1.5 mb-3">
              {#each rec.tags as tag}
                <Badge variant="brand" size="sm">{tag}</Badge>
              {/each}
              {#if rec.permissions?.isPublic}
                <Badge variant="success" size="sm">Pública</Badge>
              {/if}
            </div>
          {/if}

          <!-- Computed Macros Breakdown -->
          <div
            class="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center text-xs"
          >
            <div>
              <span class="block text-slate-400">Calorías</span>
              <span class="font-bold text-amber-600 text-sm whitespace-nowrap">
                {formatCalories(rec.macros.caloriesPerServing)}
              </span>
            </div>
            <div>
              <span class="block text-slate-400">Proteína</span>
              <span class="font-bold text-blue-600 text-sm whitespace-nowrap">
                {formatGrams(rec.macros.proteinGrams)}
              </span>
            </div>
            <div>
              <span class="block text-slate-400">Carbos</span>
              <span class="font-bold text-emerald-600 text-sm whitespace-nowrap">
                {formatGrams(rec.macros.carbsGrams)}
              </span>
            </div>
            <div>
              <span class="block text-slate-400">Grasas</span>
              <span class="font-bold text-rose-600 text-sm whitespace-nowrap">
                {formatGrams(rec.macros.fatsGrams)}
              </span>
            </div>
          </div>

          <!-- Recipe Details Snippet -->
          <div class="mt-3 text-xs text-slate-500 space-y-1">
            <p>
              <strong>Porciones:</strong>
              {rec.servings} • <strong>Prep:</strong>
              {rec.prepTimeMinutes || 10}m • <strong>Cocción:</strong>
              {rec.cookTimeMinutes || 15}m
            </p>
            {#if rec.ingredients && rec.ingredients.length > 0}
              <p class="truncate">
                <strong>Ingredientes:</strong>
                {rec.ingredients
                  .map((i) => `${i.name} (${formatNumber(i.amount)}${i.unit})`)
                  .join(', ')}
              </p>
            {/if}
          </div>

          {#snippet footer()}
            <div class="flex justify-between items-center text-xs">
              <button
                type="button"
                onclick={() => confirmDeleteRecipe(rec)}
                class="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                title="Eliminar receta"
                aria-label="Eliminar receta {rec.title}"
              >
                {$t('common.delete')}
              </button>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" onclick={() => openPermissionsModal(rec)}>
                  Colaboradores
                </Button>
              </div>
            </div>
          {/snippet}
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Recipe Builder Drawer -->
  <Drawer
    open={isDrawerOpen}
    title={$t('recipes.createRecipeBtn')}
    widthClass="max-w-xl"
    onclose={() => (isDrawerOpen = false)}
  >
    <form id="recipe-builder-form" onsubmit={handleSaveRecipe} class="space-y-4">
      <Input
        label="Título de la Receta"
        placeholder="ej. Salmón al Horno con Patatas"
        bind:value={formTitle}
        required
      />
      <Input
        label="Descripción breve"
        placeholder="ej. Almuerzo balanceado rico en Omega 3"
        bind:value={formDescription}
      />

      <div class="grid grid-cols-3 gap-2">
        <Input
          label="Porciones"
          type="number"
          placeholder="ej. 2"
          bind:value={formServings}
          required
        />
        <Input label="Prep (min)" type="number" placeholder="ej. 15" bind:value={formPrepMins} />
        <Input label="Cocción (min)" type="number" placeholder="ej. 20" bind:value={formCookMins} />
      </div>

      <!-- Ingredients Section -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Ingredientes</h4>
        <div class="flex gap-2 mb-2">
          <Input placeholder="Nombre ingrediente..." bind:value={newIngName} />
          <Input
            placeholder="Cant. (ej. 100)"
            type="number"
            bind:value={newIngAmount}
            class="w-24"
          />
          <Button variant="secondary" size="sm" onclick={addIngredient}>+</Button>
        </div>

        {#if formIngredients.length > 0}
          <div class="space-y-1 max-h-36 overflow-y-auto">
            {#each formIngredients as ing, idx}
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <span>{ing.name} — {ing.amount}{ing.unit}</span>
                <button
                  type="button"
                  onclick={() => removeIngredient(idx)}
                  class="text-red-500 font-bold px-1 cursor-pointer">✕</button
                >
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Instructions Section -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-bold text-xs uppercase tracking-wider text-slate-500">
            Pasos de Preparación
          </h4>
          <Button variant="ghost" size="sm" onclick={addInstructionStep}>+ Agregar Paso</Button>
        </div>

        {#each formInstructions as step, idx}
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs text-slate-400 font-bold w-4">{idx + 1}.</span>
            <input
              type="text"
              value={step}
              oninput={(e) => {
                formInstructions[idx] = e.currentTarget.value;
              }}
              placeholder="Describe este paso..."
              class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            {#if formInstructions.length > 1}
              <button
                type="button"
                onclick={() => removeInstructionStep(idx)}
                class="text-slate-400 hover:text-red-500 text-xs p-1">✕</button
              >
            {/if}
          </div>
        {/each}
      </div>

      <Input
        label="Etiquetas (separadas por coma)"
        placeholder="Proteína, Almuerzo, Sin Gluten"
        bind:value={formTags}
      />
    </form>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isDrawerOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button type="submit" form="recipe-builder-form" variant="primary" size="sm">
        {$t('common.confirm')}
      </Button>
    {/snippet}
  </Drawer>

  <!-- Permissions Modal -->
  <Modal
    open={isPermissionsModalOpen}
    title="Permisos y Colaboración de Receta"
    subtitle={activeRecipeForPerms?.title}
    onclose={() => (isPermissionsModalOpen = false)}
  >
    <div class="space-y-4">
      <label
        class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
      >
        <input
          type="checkbox"
          bind:checked={permsIsPublic}
          class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
        />
        <div>
          <p class="text-sm font-bold text-slate-900 dark:text-white">{$t('recipes.isPublic')}</p>
          <p class="text-xs text-slate-500">
            Cualquier usuario de MyNutritor podrá ver y copiar esta receta.
          </p>
        </div>
      </label>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Compartir con usuarios específicos
        </h4>
        <div class="flex gap-2">
          <Input placeholder="Username o ID de usuario..." bind:value={permsSharedUser} />
          <Button variant="secondary" size="sm" onclick={addSharedUser}>Agregar</Button>
        </div>

        {#if permsUsersList.length > 0}
          <div class="mt-3 flex flex-wrap gap-1.5">
            {#each permsUsersList as user}
              <Badge variant="neutral" size="sm">
                👤 {user}
                <button
                  type="button"
                  onclick={() => removeSharedUser(user)}
                  class="ml-1 text-red-500 hover:text-red-700 cursor-pointer">✕</button
                >
              </Badge>
            {/each}
          </div>
        {:else}
          <p class="text-xs text-slate-400 mt-2">{$t('recipes.noCollaborators')}</p>
        {/if}
      </div>
    </div>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isPermissionsModalOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button variant="primary" size="sm" onclick={savePermissions}
        >{$t('recipes.savePermissions')}</Button
      >
    {/snippet}
  </Modal>

  <!-- Delete Recipe Confirmation Modal -->
  <Modal
    open={isDeleteModalOpen}
    title={$t('recipes.deleteRecipeTitle')}
    subtitle={$t('recipes.deleteRecipeSubtitle')}
    onclose={cancelDeleteRecipe}
  >
    <div class="space-y-3">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {$t('recipes.deleteRecipeQuestion', { title: recipeToDelete?.title || '' })}
      </p>
      {#if recipeToDelete?.description}
        <p class="text-xs text-slate-500 dark:text-slate-400 italic">
          "{recipeToDelete.description}"
        </p>
      {/if}
      <div
        class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2"
      >
        <span>⚠️</span>
        <span>{$t('recipes.deleteRecipeWarning')}</span>
      </div>
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelDeleteRecipe}>
          {$t('common.cancel')}
        </Button>
        <Button variant="danger" size="sm" onclick={executeDeleteRecipe}
          >{$t('recipes.deleteRecipeAction')}</Button
        >
      </div>
    {/snippet}
  </Modal>
</div>
