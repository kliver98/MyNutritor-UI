<script lang="ts">
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { t } from '../../core/i18n/i18n.store';
  import {
    authStore,
    isAuthenticated,
    isAdmin,
    currentUser
  } from '../../application/auth/auth.store';
  import ThemeToggle from './ThemeToggle.svelte';
  import LanguageToggle from './LanguageToggle.svelte';
  import Button from './Button.svelte';

  interface Props {
    onopencommand?: () => void;
  }

  let { onopencommand }: Props = $props();

  let isMobileMenuOpen = $state(false);

  const toggleMobileMenu = () => {
    isMobileMenuOpen = !isMobileMenuOpen;
  };

  function isActive(href: string, pathname: string): boolean {
    const fullHref = `${base}${href === '/' ? '' : href}`;
    if (fullHref === '' || fullHref === base) {
      return pathname === fullHref || pathname === `${base}/`;
    }
    return pathname.startsWith(fullHref);
  }
</script>

<header
  class="sticky top-0 z-30 w-full max-w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs"
>
  <div
    class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-2 sm:gap-3"
  >
    <!-- Brand Logo & Main Nav -->
    <div class="flex items-center gap-3 lg:gap-6 shrink-0">
      <a
        href={$isAuthenticated ? `${base}/dashboard` : `${base}/`}
        class="flex items-center gap-2 font-black text-base tracking-tight text-slate-900 dark:text-white group shrink-0"
      >
        <div
          class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm font-black text-lg group-hover:scale-105 transition-transform"
        >
          N
        </div>
        <span class="hidden sm:inline"
          >My<span class="text-brand-600 dark:text-brand-400">Nutritor</span></span
        >
      </a>

      <!-- Desktop Navigation Links with Visual Hierarchy -->
      <nav class="hidden lg:flex items-center gap-1 text-xs font-semibold">
        {#if !$isAuthenticated}
          <a
            href="{base}/"
            class="px-2.5 py-1.5 rounded-lg transition-colors {isActive('/', $page.url.pathname)
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60'}"
          >
            {$t('nav.home')}
          </a>
        {:else}
          <!-- Dashboard (Métricas y Macros del Día) -->
          <a
            href="{base}/dashboard"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all {isActive(
              '/dashboard',
              $page.url.pathname
            )
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
          >
            <svg
              class="w-3.5 h-3.5 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-5a1 1 0 011-1h4a1 1 0 011 1v9a1 1 0 01-1 1h-4a1 1 0 01-1-1v-9z"
              />
            </svg>
            <span>{$t('nav.dashboard')}</span>
          </a>

          <!-- Alimentos (Catálogo y Exclusiones) -->
          <a
            href="{base}/foods"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all {isActive(
              '/foods',
              $page.url.pathname
            )
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
          >
            <svg
              class="w-3.5 h-3.5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 14h-2v-2h2zm0-4h-2V7h2z"
              />
            </svg>
            <span>{$t('nav.foods')}</span>
          </a>

          <!-- Recetas -->
          <a
            href="{base}/recipes"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all {isActive(
              '/recipes',
              $page.url.pathname
            )
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
          >
            <svg
              class="w-3.5 h-3.5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>{$t('nav.recipes')}</span>
          </a>

          <!-- Reportes (Gráficos y Estadísticas) -->
          <a
            href="{base}/reports"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all {isActive(
              '/reports',
              $page.url.pathname
            )
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
          >
            <svg
              class="w-3.5 h-3.5 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>{$t('nav.reports')}</span>
          </a>

          <!-- Borradores -->
          <a
            href="{base}/drafts"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all {isActive(
              '/drafts',
              $page.url.pathname
            )
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
          >
            <svg
              class="w-3.5 h-3.5 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>{$t('nav.drafts')}</span>
          </a>

          {#if $isAdmin}
            <a
              href="{base}/admin"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-bold"
            >
              <svg
                class="w-3.5 h-3.5 text-rose-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>{$t('nav.admin')}</span>
            </a>
          {/if}
        {/if}

        <!-- Separador visual sutil -->
        <span class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></span>

        <!-- Ayuda -->
        <a
          href="{base}/help"
          title="Centro de Ayuda"
          class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
        >
          <svg
            class="w-3.5 h-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="hidden xl:inline">{$t('nav.help')}</span>
        </a>

        <!-- Estado del Backend (Cápsula con indicador pulsante - solo Admin) -->
        {#if $isAdmin}
          <a
            href="{base}/status"
            title="Ver estado de conexión con el backend"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100/70 transition-colors ml-0.5"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{$t('nav.status')}</span>
          </a>
        {/if}
      </nav>
    </div>

    <!-- Center/Right Search Pill (Command Palette Compact) -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <button
        type="button"
        onclick={onopencommand}
        class="hidden md:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs cursor-pointer"
        aria-label="Abrir barra de comandos rápidos"
      >
        <svg
          class="w-3.5 h-3.5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span class="hidden xl:inline text-slate-400 font-normal">{$t('common.search')}...</span>
        <kbd
          class="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400"
        >
          Ctrl+K
        </kbd>
      </button>

      <!-- Language & Theme -->
      <LanguageToggle />
      <ThemeToggle />

      <!-- User Profile Capsule or Login Buttons -->
      {#if $isAuthenticated && $currentUser}
        <div
          class="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0"
        >
          <a
            href="{base}/settings"
            title="Ajustes de usuario"
            class="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group shrink-0"
          >
            <div
              class="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-bold text-xs flex items-center justify-center uppercase shadow-2xs shrink-0"
            >
              {($currentUser.fullName || $currentUser.username || 'U')[0]}
            </div>
            <div class="hidden xl:flex flex-col text-left">
              <span
                class="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors leading-tight"
              >
                {$currentUser.username}
              </span>
              <span
                class="text-[10px] font-semibold text-brand-600 dark:text-brand-400 uppercase leading-none"
              >
                {$isAdmin ? 'Admin' : 'User'}
              </span>
            </div>
          </a>

          <!-- Logout Icon Button (Desktop only; on mobile available inside the hamburger menu and in settings) -->
          <button
            type="button"
            onclick={() => authStore.logout()}
            class="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            title={$t('nav.logout')}
            aria-label={$t('nav.logout')}
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      {:else}
        <div class="flex items-center gap-1.5 shrink-0">
          <a href="{base}/login">
            <Button variant="outline" size="sm">{$t('nav.login')}</Button>
          </a>
          <a href="{base}/register" class="hidden sm:inline-block">
            <Button variant="primary" size="sm">{$t('nav.register')}</Button>
          </a>
        </div>
      {/if}

      <!-- Mobile Hamburger Button -->
      <button
        type="button"
        onclick={toggleMobileMenu}
        class="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
        aria-label="Abrir menú"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile Dropdown Menu -->
  {#if isMobileMenuOpen}
    <div
      class="lg:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2 bg-white dark:bg-slate-900"
    >
      <button
        type="button"
        onclick={() => {
          isMobileMenuOpen = false;
          if (onopencommand) onopencommand();
        }}
        class="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium flex items-center justify-between"
      >
        <span>🔍 {$t('nav.quickAction')}</span>
        <kbd
          class="font-mono text-[10px] px-1 py-0.5 rounded border border-slate-300 dark:border-slate-700"
        >
          Ctrl+K
        </kbd>
      </button>

      {#if $isAuthenticated}
        <a
          href="{base}/dashboard"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold {isActive(
            '/dashboard',
            $page.url.pathname
          )
            ? 'text-brand-600 bg-brand-50/50'
            : 'text-slate-700 dark:text-slate-200'}"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          {$t('nav.dashboard')}
        </a>
        <a
          href="{base}/foods"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold {isActive(
            '/foods',
            $page.url.pathname
          )
            ? 'text-brand-600 bg-brand-50/50'
            : 'text-slate-700 dark:text-slate-200'}"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          {$t('nav.foods')}
        </a>
        <a
          href="{base}/recipes"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold {isActive(
            '/recipes',
            $page.url.pathname
          )
            ? 'text-brand-600 bg-brand-50/50'
            : 'text-slate-700 dark:text-slate-200'}"
        >
          <span class="w-2 h-2 rounded-full bg-blue-500"></span>
          {$t('nav.recipes')}
        </a>
        <a
          href="{base}/reports"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold {isActive(
            '/reports',
            $page.url.pathname
          )
            ? 'text-brand-600 bg-brand-50/50'
            : 'text-slate-700 dark:text-slate-200'}"
        >
          <span class="w-2 h-2 rounded-full bg-purple-500"></span>
          {$t('nav.reports')}
        </a>
        <a
          href="{base}/drafts"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold {isActive(
            '/drafts',
            $page.url.pathname
          )
            ? 'text-brand-600 bg-brand-50/50'
            : 'text-slate-700 dark:text-slate-200'}"
        >
          <span class="w-2 h-2 rounded-full bg-orange-500"></span>
          {$t('nav.drafts')}
        </a>
        <a
          href="{base}/settings"
          class="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {$t('nav.settings')}
        </a>
        {#if $isAdmin}
          <a
            href="{base}/admin"
            class="block px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 font-bold text-sm"
          >
            {$t('nav.admin')}
          </a>
        {/if}
        <div
          class="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center"
        >
          <span class="text-xs text-slate-500"
            >{$currentUser?.username} ({$isAdmin ? 'Admin' : 'User'})</span
          >
          <Button variant="outline" size="sm" onclick={() => authStore.logout()}>
            {$t('nav.logout')}
          </Button>
        </div>
      {:else}
        <a
          href="{base}/"
          class="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
        >
          {$t('nav.home')}
        </a>
        <div class="grid grid-cols-2 gap-2 pt-2">
          <a href="{base}/login">
            <Button variant="outline" size="sm" class="w-full">{$t('nav.login')}</Button>
          </a>
          <a href="{base}/register">
            <Button variant="primary" size="sm" class="w-full">{$t('nav.register')}</Button>
          </a>
        </div>
      {/if}

      <div
        class="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500"
      >
        <a href="{base}/help" class="hover:underline">{$t('nav.help')}</a>
        {#if $isAdmin}
          <a
            href="{base}/status"
            class="flex items-center gap-1.5 hover:underline text-emerald-600"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            {$t('nav.status')}
          </a>
        {/if}
      </div>
    </div>
  {/if}
</header>
