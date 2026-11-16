<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsStore } from '$lib/application/settings/settings.store';
  import { currentUser } from '$lib/application/auth/auth.store';
  import { t, localeStore, setLocale, type Locale } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Badge from '$lib/ui/components/Badge.svelte';

  // Form local state (no working defaults, clean placeholders)
  let calGoal = $state<number | string>('');
  let proteinGoal = $state<number | string>('');
  let carbsGoal = $state<number | string>('');
  let fatsGoal = $state<number | string>('');
  let themePref = $state<'light' | 'dark' | 'system'>('system');
  let customBgColor = $state('');
  let measureUnit = $state<'metric' | 'imperial'>('metric');
  let notifsEnabled = $state(true);

  onMount(async () => {
    await settingsStore.fetchSettings();
    if ($settingsStore.settings) {
      calGoal = $settingsStore.settings.dailyCalorieGoal || '';
      proteinGoal = $settingsStore.settings.dailyProteinGoal || '';
      carbsGoal = $settingsStore.settings.dailyCarbsGoal || '';
      fatsGoal = $settingsStore.settings.dailyFatsGoal || '';
      themePref = $settingsStore.settings.themePreference || 'system';
      customBgColor = $settingsStore.settings.customBackgroundColor || '';
      measureUnit = $settingsStore.settings.measurementUnit || 'metric';
      notifsEnabled = $settingsStore.settings.notificationsEnabled ?? true;
    }
  });

  async function handleSaveSettings(e: SubmitEvent) {
    e.preventDefault();
    await settingsStore.updateSettings({
      dailyCalorieGoal: Number(calGoal) || 2000,
      dailyProteinGoal: Number(proteinGoal) || 150,
      dailyCarbsGoal: Number(carbsGoal) || 200,
      dailyFatsGoal: Number(fatsGoal) || 65,
      themePreference: themePref,
      customBackgroundColor: customBgColor.trim() || undefined,
      measurementUnit: measureUnit,
      notificationsEnabled: notifsEnabled
    });
  }
</script>

<div class="space-y-6 max-w-4xl mx-auto">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('settings.title')}</h1>
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
      {$t('settings.subtitle')}
    </p>
  </div>

  <form onsubmit={handleSaveSettings} class="space-y-6">
    <!-- User Profile Info -->
    <Card title={$t('settings.profileSection')}>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span class="text-xs text-slate-400">Usuario</span>
          <p class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
            {$currentUser?.username || 'Invitado'}
          </p>
        </div>
        <div>
          <span class="text-xs text-slate-400">Correo Electrónico</span>
          <p class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
            {$currentUser?.email || 'N/A'}
          </p>
        </div>
        <div>
          <span class="text-xs text-slate-400">Rol del Sistema</span>
          <div class="mt-0.5">
            <Badge variant={$currentUser?.role === 'admin' ? 'warning' : 'brand'}>
              {$currentUser?.role || 'user'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>

    <!-- Daily Nutritional Targets -->
    <Card
      title={$t('settings.goalsSection')}
      subtitle="Valores de referencia para los anillos de progreso del Dashboard"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label={$t('settings.calorieGoal')}
          type="number"
          placeholder="ej. 2200"
          bind:value={calGoal}
          required
        />
        <Input
          label={$t('settings.proteinGoal')}
          type="number"
          placeholder="ej. 160"
          bind:value={proteinGoal}
          required
        />
        <Input
          label={$t('settings.carbsGoal')}
          type="number"
          placeholder="ej. 220"
          bind:value={carbsGoal}
          required
        />
        <Input
          label={$t('settings.fatsGoal')}
          type="number"
          placeholder="ej. 70"
          bind:value={fatsGoal}
          required
        />
      </div>
    </Card>

    <!-- Visual & Language Preferences -->
    <Card title={$t('settings.preferencesSection')}>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <!-- Theme Preference -->
        <div class="space-y-1.5">
          <label
            for="theme-pref-select"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {$t('settings.theme')}
          </label>
          <select
            id="theme-pref-select"
            bind:value={themePref}
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="system">{$t('settings.themeSystem')}</option>
            <option value="light">{$t('settings.themeLight')}</option>
            <option value="dark">{$t('settings.themeDark')}</option>
          </select>
        </div>

        <!-- Language Preference -->
        <div class="space-y-1.5">
          <label
            for="lang-pref-select"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {$t('settings.language')}
          </label>
          <select
            id="lang-pref-select"
            value={$localeStore}
            onchange={(e) => setLocale(e.currentTarget.value as Locale)}
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="es">Español (ES)</option>
            <option value="en">English (EN)</option>
          </select>
        </div>

        <!-- Units System -->
        <div class="space-y-1.5">
          <label
            for="units-pref-select"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {$t('settings.measurementUnit')}
          </label>
          <select
            id="units-pref-select"
            bind:value={measureUnit}
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="metric">{$t('settings.metric')}</option>
            <option value="imperial">{$t('settings.imperial')}</option>
          </select>
        </div>

        <!-- Custom Background Color -->
        <div class="space-y-1.5 sm:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <label
              for="custom-bg-input"
              class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Fondo Personalizado por Defecto
            </label>
            {#if customBgColor}
              <button
                type="button"
                onclick={() => (customBgColor = '')}
                class="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Restablecer a estándar
              </button>
            {/if}
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Color de fondo predeterminado guardado en tu perfil de Firestore (ej. #206fb0).
          </p>
          <div class="flex items-center gap-3">
            <input
              id="custom-bg-input"
              type="color"
              bind:value={customBgColor}
              class="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-1"
            />
            <input
              type="text"
              placeholder="#206fb0 o entero ARGB (-14651472)"
              bind:value={customBgColor}
              class="w-full max-w-xs px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
            />
            {#if customBgColor}
              <div
                class="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs"
                style="background-color: {customBgColor};"
                title="Vista previa del color"
              ></div>
            {/if}
          </div>
        </div>
      </div>
    </Card>

    <div class="flex justify-end">
      <Button type="submit" variant="primary" size="md" loading={$settingsStore.isLoading}>
        {$t('settings.saveChanges')}
      </Button>
    </div>
  </form>
</div>
