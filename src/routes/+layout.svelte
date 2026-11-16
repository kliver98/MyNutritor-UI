<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import '../app.css';
  import Navbar from '$lib/ui/components/Navbar.svelte';
  import BottomNav from '$lib/ui/components/BottomNav.svelte';
  import ToastContainer from '$lib/ui/components/ToastContainer.svelte';
  import CommandPalette from '$lib/ui/components/CommandPalette.svelte';
  import { authStore, isAuthenticated, isAdmin } from '$lib/application/auth/auth.store';
  import { healthStore } from '$lib/application/system/health.store';
  import { customBgStore, isCustomBgDark } from '$lib/application/theme/theme.store';
  import { t } from '$lib/core/i18n/i18n.store';

  let { children } = $props();

  let isCommandOpen = $state(false);

  function openCommand() {
    isCommandOpen = true;
  }

  const normalizedPath = $derived.by(() => {
    let p: string = $page.url.pathname;
    if (base && p.startsWith(base)) {
      p = p.slice(base.length);
    }
    if (!p.startsWith('/')) {
      p = '/' + p;
    }
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p;
  });

  const isPublicRoute = $derived.by(() => {
    const p = normalizedPath;
    return p === '/' || p === '/login' || p === '/register' || p === '/help';
  });

  const isAdminRoute = $derived.by(() => {
    const p = normalizedPath;
    return p === '/admin' || p.startsWith('/admin/') || p === '/status';
  });

  const isRouteAllowed = $derived.by(() => {
    if (isPublicRoute) return true;
    if (!$authStore.isInitialized) {
      return $isAuthenticated;
    }
    if (!$isAuthenticated) return false;
    if (isAdminRoute && !$isAdmin) return false;
    return true;
  });

  $effect(() => {
    if (!$authStore.isInitialized) return;

    const p = normalizedPath;
    if (!isPublicRoute && !$isAuthenticated) {
      goto(`${base}/login`);
    } else if ($isAuthenticated && (p === '/login' || p === '/register')) {
      goto(`${base}/dashboard`);
    } else if (isAdminRoute && !$isAdmin) {
      goto(`${base}/dashboard`);
    }
  });

  onMount(() => {
    authStore.init();
    healthStore.checkHealth();

    // Interceptor global para que ningún enlace <a> navegue fuera de la base en GitHub Pages
    const handleAnchorClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return;
      const href = target.getAttribute('href');
      if (!href) return;

      // Si es un link relativo a la raíz (ej. '/dashboard') y existe un base configurado
      if (href.startsWith('/') && !href.startsWith('//')) {
        if (base && !href.startsWith(base)) {
          e.preventDefault();
          goto(`${base}${href}`);
        }
      }
    };

    window.addEventListener('click', handleAnchorClick, true);
    return () => window.removeEventListener('click', handleAnchorClick, true);
  });
</script>

<div
  class="min-h-full flex flex-col transition-colors pb-16 md:pb-0 w-full max-w-full overflow-x-hidden"
  class:text-white={$isCustomBgDark}
  class:text-slate-900={!$isCustomBgDark}
  class:dark:text-slate-100={!$customBgStore}
  style={$customBgStore ? `background-color: ${$customBgStore};` : ''}
  class:bg-slate-50={!$customBgStore}
  class:dark:bg-slate-950={!$customBgStore}
>
  <!-- Offline / Degradation Alert Banner -->
  {#if $healthStore.error}
    <div
      role="status"
      aria-live="polite"
      class="bg-amber-500 dark:bg-amber-600 text-slate-950 font-medium text-xs px-4 py-2 flex items-center justify-between shadow-xs"
    >
      <div class="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span>⚠️</span>
        <span>{$t('common.offlineBanner')}</span>
        <button
          type="button"
          onclick={() => healthStore.checkHealth()}
          class="ml-auto underline font-bold hover:opacity-80 cursor-pointer"
        >
          {$t('common.retry')}
        </button>
      </div>
    </div>
  {/if}

  <Navbar onopencommand={openCommand} />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
    {#if !isRouteAllowed}
      <div
        class="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center"
        role="status"
        aria-live="polite"
      >
        <div
          class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {#if !$authStore.isInitialized}
            {$t('common.loading')}
          {:else}
            Redirigiendo...
          {/if}
        </p>
      </div>
    {:else if children}
      {@render children()}
    {/if}
  </main>

  <footer
    class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
  >
    <div
      class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2"
    >
      <p>MyNutritor &copy; {new Date().getFullYear()} - {$t('common.tagline')}</p>
      <div class="flex items-center gap-4 text-xs">
        <a href="{base}/help" class="hover:underline">{$t('nav.help')}</a>
        {#if $isAdmin}
          <span>•</span>
          <a href="{base}/status" class="hover:underline text-emerald-600 dark:text-emerald-400">
            {$t('nav.status')}
          </a>
        {/if}
      </div>
    </div>
  </footer>

  <!-- Mobile Bottom Navigation -->
  <BottomNav onopencommand={openCommand} />

  <!-- Global Toast Notifications Stack -->
  <ToastContainer />

  <!-- Quick Command Palette (Ctrl+K) -->
  <CommandPalette bind:open={isCommandOpen} />
</div>
