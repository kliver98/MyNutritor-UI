<script lang="ts">
  import { base } from '$app/paths';
  import { t } from '../../core/i18n/i18n.store';
  import { isAuthenticated, isAdmin } from '../../application/auth/auth.store';

  interface Props {
    onopencommand?: () => void;
  }

  let { onopencommand }: Props = $props();
</script>

<nav
  aria-label="Navegación móvil inferior"
  class="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg"
>
  <a
    href={$isAuthenticated ? `${base}/dashboard` : `${base}/`}
    class="flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs"
  >
    <span class="text-lg">📊</span>
    <span class="text-[10px] font-medium">{$t('nav.dashboard')}</span>
  </a>

  <a
    href="{base}/foods"
    class="flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs"
  >
    <span class="text-lg">🥑</span>
    <span class="text-[10px] font-medium">{$t('nav.foods')}</span>
  </a>

  <a
    href="{base}/recipes"
    class="flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs"
  >
    <span class="text-lg">📖</span>
    <span class="text-[10px] font-medium">{$t('nav.recipes')}</span>
  </a>

  <a
    href="{base}/reports"
    class="flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 text-xs"
  >
    <span class="text-lg">📈</span>
    <span class="text-[10px] font-medium">{$t('nav.reports')}</span>
  </a>

  {#if $isAdmin}
    <a
      href="{base}/admin"
      class="flex flex-col items-center justify-center p-1 text-rose-600 dark:text-rose-400 text-xs"
    >
      <span class="text-lg">🛡️</span>
      <span class="text-[10px] font-medium">Admin</span>
    </a>
  {:else}
    <button
      type="button"
      onclick={onopencommand}
      class="flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 text-xs cursor-pointer"
    >
      <span class="text-lg">⚡</span>
      <span class="text-[10px] font-medium">Acciones</span>
    </button>
  {/if}
</nav>
