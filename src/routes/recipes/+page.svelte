<script lang="ts">
  import { onMount } from 'svelte';
  import { recipesStore } from '$lib/application/recipes/recipes.store';
  import { foodsStore } from '$lib/application/foods/foods.store';
  import { authStore, isAdmin } from '$lib/application/auth/auth.store';
  import { toastStore } from '$lib/core/feedback/toast.store';
  import { repositories } from '$lib/infrastructure/container';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Badge from '$lib/ui/components/Badge.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import RefreshButton from '$lib/ui/components/RefreshButton.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Drawer from '$lib/ui/components/Drawer.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import type { Recipe, RecipeIngredient } from '$lib/domain/recipes/Recipe';
  import {
    formatGrams,
    formatCalories,
    formatNumber,
    roundToDecimals
  } from '$lib/core/utils/format';

  let isDrawerOpen = $state(false);
  let isPermissionsModalOpen = $state(false);
  let activeRecipeForPerms = $state<Recipe | null>(null);

  // Ownership helper: solo los dueños de las recetas pueden modificarlas o eliminarlas
  function isRecipeOwner(recipe: Recipe): boolean {
    if (!$authStore.user) return false;
    const currentId = String($authStore.user.id || '').trim();
    const currentUserId = String($authStore.user.userId || '').trim();
    const currentUsername = String($authStore.user.username || '')
      .trim()
      .toLowerCase();

    const recipeAuthorId = String(recipe.authorId || '').trim();
    const recipeAuthorUsername = String(recipe.authorUsername || '')
      .trim()
      .toLowerCase();

    // 1. Coincidencia por ID de autor
    if (recipeAuthorId) {
      if (recipeAuthorId === currentId || (currentUserId && recipeAuthorId === currentUserId)) {
        return true;
      }
      // Firestore a veces almacena el username como authorId
      if (currentUsername && recipeAuthorId.toLowerCase() === currentUsername) {
        return true;
      }
    }

    // 2. Coincidencia por authorUsername
    if (recipeAuthorUsername && currentUsername) {
      if (recipeAuthorUsername === currentUsername) {
        return true;
      }
    }

    // 3. Fallback para recetas recién creadas en sesión o marcadas con 'me'
    if (recipeAuthorId === 'me' || recipeAuthorUsername === 'me') {
      return true;
    }

    return false;
  }

  // Delete confirmation modal state
  let recipeToDelete = $state<Recipe | null>(null);
  let isDeleteModalOpen = $state(false);

  function confirmDeleteRecipe(recipe: Recipe) {
    if (!isRecipeOwner(recipe)) return;
    recipeToDelete = recipe;
    isDeleteModalOpen = true;
  }

  async function executeDeleteRecipe() {
    if (!recipeToDelete || !isRecipeOwner(recipeToDelete)) return;
    const id = recipeToDelete.id;
    isDeleteModalOpen = false;
    recipeToDelete = null;
    await recipesStore.deleteRecipe(id);
    toastStore.success('Receta eliminada correctamente');
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
  let selectedFoodItemId = $state<string | undefined>(undefined);

  // Permissions & Collaborators state
  let permsIsPublic = $state(false);
  let permsSharedUser = $state('');
  let permsUsersList = $state<string[]>([]);
  let availableUsernames = $state<string[]>([]);
  let userSearchError = $state<string | null>(null);

  onMount(() => {
    recipesStore.fetchRecipes();
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
    if ($foodsStore.items.length === 0) foodsStore.fetchFoods();
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
    selectedFoodItemId = undefined;
    isDrawerOpen = true;
  }

  function handleFoodInput() {
    const trimmed = newIngName.trim().toLowerCase();
    const match = $foodsStore.items.find((f) => f.name.toLowerCase() === trimmed);
    if (match) {
      selectedFoodItemId = match.id;
      newIngUnit = match.servingUnit || 'g';
      if (!newIngAmount) {
        newIngAmount = match.servingSize || 100;
      }
    } else {
      selectedFoodItemId = undefined;
    }
  }

  function addIngredient() {
    if (!newIngName.trim()) return;
    const match = $foodsStore.items.find(
      (f) => f.name.toLowerCase() === newIngName.trim().toLowerCase()
    );

    formIngredients = [
      ...formIngredients,
      {
        foodItemId: match?.id || selectedFoodItemId,
        name: newIngName.trim(),
        amount: Number(newIngAmount) || 100,
        unit: match?.servingUnit || newIngUnit || 'g'
      }
    ];
    newIngName = '';
    newIngAmount = '';
    selectedFoodItemId = undefined;
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

    // Calcular macros automáticamente según los alimentos seleccionados
    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    for (const ing of formIngredients) {
      const match = $foodsStore.items.find(
        (f) =>
          (ing.foodItemId && f.id === ing.foodItemId) ||
          f.name.toLowerCase() === ing.name.toLowerCase()
      );
      if (match) {
        const factor = (ing.amount || 100) / (match.servingSize || 100);
        totalCals += match.calories * factor;
        totalP += match.proteinGrams * factor;
        totalC += match.carbsGrams * factor;
        totalF += match.fatsGrams * factor;
      }
    }

    const servingsCount = Number(formServings) || 1;
    const caloriesPerServing = roundToDecimals(totalCals / servingsCount, 0);
    const proteinGrams = roundToDecimals(totalP / servingsCount, 2);
    const carbsGrams = roundToDecimals(totalC / servingsCount, 2);
    const fatsGrams = roundToDecimals(totalF / servingsCount, 2);

    await recipesStore.createRecipe({
      title: formTitle.trim(),
      description: formDescription.trim(),
      servings: servingsCount,
      prepTimeMinutes: Number(formPrepMins) || 0,
      cookTimeMinutes: Number(formCookMins) || 0,
      ingredients: formIngredients,
      instructions: formInstructions.filter(Boolean),
      macros: {
        caloriesPerServing,
        proteinGrams,
        carbsGrams,
        fatsGrams
      },
      authorId: $authStore.user?.id || 'me',
      authorUsername: $authStore.user?.username || 'me',
      permissions: { isPublic: false, sharedWithUserIds: [] },
      tags: tagsArray
    });

    isDrawerOpen = false;
  }

  async function loadAvailableUsers() {
    // Solo los administradores tienen acceso al endpoint /api/v1/users; evitar 403 Forbidden para usuarios normales
    if (!$isAdmin) return;
    try {
      const users = await repositories.users.getAll();
      availableUsernames = users.map((u) => u.username).filter(Boolean);
    } catch {
      availableUsernames = [];
    }
  }

  function openPermissionsModal(recipe: Recipe) {
    if (!isRecipeOwner(recipe)) return;
    activeRecipeForPerms = recipe;
    permsIsPublic = recipe.permissions?.isPublic ?? false;
    permsUsersList = [...(recipe.permissions?.sharedWithUserIds || [])];
    permsSharedUser = '';
    userSearchError = null;
    isPermissionsModalOpen = true;
    loadAvailableUsers();
  }

  const userSuggestions = $derived(
    $isAdmin && permsSharedUser.trim().length >= 3
      ? availableUsernames.filter(
          (u) =>
            u.toLowerCase().includes(permsSharedUser.trim().toLowerCase()) &&
            !permsUsersList.includes(u)
        )
      : []
  );

  async function addSharedUser(targetUser?: string) {
    const raw = (targetUser || permsSharedUser).trim();
    if (!raw) return;

    if (raw.length < 3) {
      userSearchError = 'Ingresa al menos 3 caracteres para buscar un colaborador.';
      return;
    }

    if (permsUsersList.some((u) => u.toLowerCase() === raw.toLowerCase())) {
      userSearchError = `El usuario "${raw}" ya fue agregado como colaborador.`;
      return;
    }

    userSearchError = null;

    // 1. Si es admin y tenemos la lista completa cargada, verificar coincidencia exacta
    if ($isAdmin && availableUsernames.length > 0) {
      const found = availableUsernames.find((u) => u.toLowerCase() === raw.toLowerCase());
      if (!found) {
        userSearchError = `El usuario "${raw}" no existe en el sistema.`;
        return;
      }
      permsUsersList = [...permsUsersList, found];
      permsSharedUser = '';
      return;
    }

    // 2. Para usuarios regulares (no-admin), validar formato estándar de username
    // y dejar que la API valide la existencia al persistir permisos
    const validUsernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;
    if (!validUsernameRegex.test(raw)) {
      userSearchError =
        'Nombre de usuario inválido. Usa letras, números, puntos o guiones (3-30 caracteres).';
      return;
    }

    permsUsersList = [...permsUsersList, raw];
    permsSharedUser = '';
  }

  function removeSharedUser(user: string) {
    permsUsersList = permsUsersList.filter((u) => u !== user);
  }

  async function savePermissions() {
    if (!activeRecipeForPerms || !isRecipeOwner(activeRecipeForPerms)) return;
    try {
      await recipesStore.updatePermissions(activeRecipeForPerms.id, {
        isPublic: permsIsPublic,
        sharedWithUserIds: permsUsersList
      });
      isPermissionsModalOpen = false;
      toastStore.success('Permisos actualizados correctamente');
    } catch (err: unknown) {
      userSearchError = (err as Error)?.message || 'Error al guardar los permisos de la receta.';
    }
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
    <div class="flex items-center gap-2">
      <RefreshButton variant="button" />
      <Button variant="primary" size="sm" onclick={openCreateDrawer}>
        {$t('recipes.createRecipeBtn')}
      </Button>
    </div>
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
            {#if isRecipeOwner(rec)}
              <button
                type="button"
                onclick={() => openPermissionsModal(rec)}
                class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/80 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Gestionar Permisos y Colaboradores"
              >
                <span>{rec.permissions?.isPublic ? '🌐' : '🔒'}</span>
                <span class="inline text-slate-900 dark:text-white font-bold">Permisos</span>
              </button>
            {:else}
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs"
                title={rec.permissions?.isPublic
                  ? 'Receta pública de la comunidad'
                  : 'Receta compartida contigo'}
              >
                <span>{rec.permissions?.isPublic ? '🌐' : '🔒'}</span>
                <span>{rec.permissions?.isPublic ? 'Pública' : 'Compartida'}</span>
              </span>
            {/if}
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
            class="grid grid-cols-4 gap-2 py-3 border-y border-slate-200 dark:border-slate-800 text-center text-xs"
          >
            <div>
              <span class="block text-slate-600 dark:text-slate-400 font-medium">Calorías</span>
              <span class="font-bold text-amber-600 dark:text-amber-500 text-sm whitespace-nowrap">
                {formatCalories(rec.macros.caloriesPerServing)}
              </span>
            </div>
            <div>
              <span class="block text-slate-600 dark:text-slate-400 font-medium">Proteína</span>
              <span class="font-bold text-blue-600 dark:text-blue-400 text-sm whitespace-nowrap">
                {formatGrams(rec.macros.proteinGrams)}
              </span>
            </div>
            <div>
              <span class="block text-slate-600 dark:text-slate-400 font-medium">Carbos</span>
              <span
                class="font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap"
              >
                {formatGrams(rec.macros.carbsGrams)}
              </span>
            </div>
            <div>
              <span class="block text-slate-600 dark:text-slate-400 font-medium">Grasas</span>
              <span class="font-bold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                {formatGrams(rec.macros.fatsGrams)}
              </span>
            </div>
          </div>

          <!-- Recipe Details Snippet -->
          <div class="mt-3 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p>
              <strong class="text-slate-900 dark:text-slate-100 font-bold">Porciones:</strong>
              <span class="text-slate-800 dark:text-slate-200 font-medium">{rec.servings}</span> •
              <strong class="text-slate-900 dark:text-slate-100 font-bold">Prep:</strong>
              <span class="text-slate-800 dark:text-slate-200 font-medium"
                >{rec.prepTimeMinutes || 10}m</span
              >
              •
              <strong class="text-slate-900 dark:text-slate-100 font-bold">Cocción:</strong>
              <span class="text-slate-800 dark:text-slate-200 font-medium"
                >{rec.cookTimeMinutes || 15}m</span
              >
            </p>
            {#if rec.ingredients && rec.ingredients.length > 0}
              <p class="truncate">
                <strong class="text-slate-900 dark:text-slate-100 font-bold">Ingredientes:</strong>
                <span class="text-slate-800 dark:text-slate-200">
                  {rec.ingredients
                    .map((i) => `${i.name} (${formatNumber(i.amount)}${i.unit})`)
                    .join(', ')}
                </span>
              </p>
            {/if}
          </div>

          {#snippet footer()}
            <div class="flex justify-between items-center text-xs w-full">
              {#if isRecipeOwner(rec)}
                <button
                  type="button"
                  onclick={() => confirmDeleteRecipe(rec)}
                  class="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-bold cursor-pointer transition-colors"
                  title="Eliminar receta"
                  aria-label="Eliminar receta {rec.title}"
                >
                  {$t('common.delete')}
                </button>
              {:else}
                <span class="text-xs text-slate-600 dark:text-slate-400 font-medium italic">
                  Receta de: @{rec.authorUsername || rec.authorId || 'comunidad'}
                </span>
              {/if}
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

      <!-- Ingredients / Foods Section -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4
          class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
        >
          Alimentos e Ingredientes
        </h4>
        <div class="space-y-2 mb-2">
          <div class="flex gap-2">
            <div class="flex-1">
              <Input
                placeholder="Escribe o busca un alimento..."
                bind:value={newIngName}
                oninput={handleFoodInput}
              />
            </div>
            <Input
              placeholder="Gramos / Cant."
              type="number"
              bind:value={newIngAmount}
              class="w-28"
            />
            <Button variant="secondary" size="sm" onclick={addIngredient}>+ Añadir</Button>
          </div>

          <!-- Sugerencias rápidas del catálogo de alimentos -->
          {#if newIngName.trim().length >= 2 && !selectedFoodItemId}
            {@const matchingFoods = $foodsStore.items
              .filter((f) => f.name.toLowerCase().includes(newIngName.trim().toLowerCase()))
              .slice(0, 5)}
            {#if matchingFoods.length > 0}
              <div
                class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-1"
              >
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Alimentos encontrados en el catálogo:
                </p>
                {#each matchingFoods as food}
                  <button
                    type="button"
                    onclick={() => {
                      newIngName = food.name;
                      selectedFoodItemId = food.id;
                      newIngUnit = food.servingUnit || 'g';
                      if (!newIngAmount) newIngAmount = food.servingSize || 100;
                    }}
                    class="w-full text-left px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center cursor-pointer"
                  >
                    <span class="font-medium"
                      >🥑 {food.name} {food.brand ? `(${food.brand})` : ''}</span
                    >
                    <span class="text-[10px] text-brand-600 dark:text-brand-400 font-semibold"
                      >{food.calories} kcal / {food.servingSize}{food.servingUnit || 'g'}</span
                    >
                  </button>
                {/each}
              </div>
            {/if}
          {/if}
        </div>

        {#if formIngredients.length > 0}
          <div class="space-y-1.5 max-h-40 overflow-y-auto mt-2">
            {#each formIngredients as ing, idx}
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200"
              >
                <div class="flex items-center gap-1.5 font-medium">
                  <span>🥗 {ing.name}</span>
                  <span class="text-slate-500 dark:text-slate-400">({ing.amount}{ing.unit})</span>
                </div>
                <button
                  type="button"
                  onclick={() => removeIngredient(idx)}
                  class="text-rose-500 hover:text-rose-700 font-black px-1.5 py-0.5 rounded cursor-pointer"
                  title="Quitar alimento"
                  aria-label="Quitar alimento {ing.name}"
                >
                  ✕
                </button>
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
    <div class="space-y-5">
      <label
        class="flex items-start gap-3 p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <input
          type="checkbox"
          bind:checked={permsIsPublic}
          class="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
        />
        <div>
          <p class="text-sm font-bold text-slate-900 dark:text-white">{$t('recipes.isPublic')}</p>
          <p class="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
            Cualquier usuario de MyNutritor podrá ver y copiar esta receta.
          </p>
        </div>
      </label>

      <div>
        <label
          for="shared-user-input"
          class="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-1"
        >
          Compartir con usuarios específicos
        </label>
        <p class="text-xs text-slate-700 dark:text-slate-300 mb-2.5 font-medium">
          Agrega colaboradores por su nombre de usuario para que puedan ver esta receta.
        </p>
        <div class="relative">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Input
                id="shared-user-input"
                placeholder="Nombre de usuario (ej: marcos)..."
                bind:value={permsSharedUser}
                oninput={() => (userSearchError = null)}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={permsSharedUser.trim().length < 3}
              onclick={() => addSharedUser()}
            >
              Agregar
            </Button>
          </div>

          <!-- Sugerencias de usuarios mientras escribe (>= 3 chars, administradores) -->
          {#if userSuggestions.length > 0}
            <div
              class="absolute z-20 left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg py-1 divide-y divide-slate-100 dark:divide-slate-700/50"
            >
              {#each userSuggestions as suggestedUser}
                <button
                  type="button"
                  class="w-full text-left px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-700 dark:hover:text-brand-300 flex items-center justify-between font-semibold cursor-pointer"
                  onclick={() => addSharedUser(suggestedUser)}
                >
                  <span class="flex items-center gap-1.5">
                    <span>👤</span>
                    <span>{suggestedUser}</span>
                  </span>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-normal"
                    >Hacer clic para agregar</span
                  >
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if userSearchError}
          <p
            class="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1"
          >
            <span>⚠️</span>
            <span>{userSearchError}</span>
          </p>
        {/if}

        <div class="mt-4">
          <p
            class="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5"
          >
            Colaboradores activos ({permsUsersList.length}):
          </p>
          {#if permsUsersList.length > 0}
            <div class="flex flex-wrap gap-1.5">
              {#each permsUsersList as user}
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 shadow-sm"
                >
                  <span>👤</span>
                  <span>{user}</span>
                  <button
                    type="button"
                    onclick={() => removeSharedUser(user)}
                    class="ml-0.5 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold cursor-pointer"
                    aria-label={`Eliminar colaborador ${user}`}
                  >
                    ✕
                  </button>
                </span>
              {/each}
            </div>
          {:else}
            <p class="text-xs text-slate-600 dark:text-slate-400 italic">
              {$t('recipes.noCollaborators')}
            </p>
          {/if}
        </div>
      </div>
    </div>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isPermissionsModalOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button variant="primary" size="sm" onclick={savePermissions}>
        {$t('recipes.savePermissions')}
      </Button>
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
