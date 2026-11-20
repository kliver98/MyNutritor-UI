<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { t } from '../../core/i18n/i18n.store';
  import { toastStore } from '../../core/feedback/toast.store';
  import { macrosStore } from '../../application/macros/macros.store';
  import { foodsStore } from '../../application/foods/foods.store';
  import { recipesStore } from '../../application/recipes/recipes.store';
  import { reportsStore } from '../../application/reports/reports.store';
  import { settingsStore } from '../../application/settings/settings.store';
  import { adminStore } from '../../application/admin/admin.store';
  import { draftsStore } from '../../application/drafts/drafts.store';
  import { healthStore } from '../../application/system/health.store';
  import { getLocalDateStr } from '../../core/utils/format';

  interface Props {
    class?: string;
    variant?: 'icon' | 'button';
  }

  let { class: customClass = '', variant = 'icon' }: Props = $props();

  let isRefreshing = $state(false);

  async function handleRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;

    // Normalización de la ruta actual para identificar la pantalla activa
    const rawPath = $page.url.pathname;
    const pathWithoutBase = rawPath.startsWith(base) ? rawPath.slice(base.length) : rawPath;
    const normalized = pathWithoutBase.replace(/\/$/, '') || '/';

    try {
      if (normalized === '/dashboard' || normalized === '/') {
        await Promise.all([
          macrosStore.fetchHistory(true),
          macrosStore.fetchForDate($macrosStore.selectedDate || getLocalDateStr())
        ]);
      } else if (normalized.startsWith('/foods')) {
        await Promise.all([foodsStore.fetchFoods(true), foodsStore.fetchExclusions(true)]);
      } else if (normalized.startsWith('/recipes')) {
        await recipesStore.fetchRecipes(true);
      } else if (normalized.startsWith('/reports')) {
        await reportsStore.fetchData(undefined, undefined, true);
      } else if (normalized.startsWith('/settings')) {
        await settingsStore.fetchSettings(true);
      } else if (normalized.startsWith('/admin')) {
        await adminStore.fetchAllAdminData();
      } else if (normalized.startsWith('/drafts')) {
        await draftsStore.fetchDrafts();
      } else if (normalized.startsWith('/status')) {
        await healthStore.checkHealth(true);
      }
      toastStore.success($t('common.refreshSuccess'));
    } catch (err: unknown) {
      toastStore.error((err as Error)?.message || 'Error al refrescar contenido');
    } finally {
      isRefreshing = false;
    }
  }
</script>

{#if variant === 'button'}
  <button
    type="button"
    onclick={handleRefresh}
    disabled={isRefreshing}
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs {customClass}"
    title={$t('common.refresh')}
    aria-label={$t('common.refresh')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 {isRefreshing
        ? 'animate-spin'
        : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      width="16"
      height="16"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    <span>{$t('common.refresh')}</span>
  </button>
{:else}
  <button
    type="button"
    onclick={handleRefresh}
    disabled={isRefreshing}
    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none disabled:opacity-50 shadow-2xs {customClass}"
    title={$t('common.refresh')}
    aria-label={$t('common.refresh')}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 {isRefreshing
        ? 'animate-spin'
        : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
      width="16"
      height="16"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    <span class="hidden md:inline">{$t('common.refresh')}</span>
  </button>
{/if}
