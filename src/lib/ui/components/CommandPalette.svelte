<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { t, toggleLocale } from '../../core/i18n/i18n.store';
  import { themeStore } from '../../application/theme/theme.store';
  import { authStore, isAdmin } from '../../application/auth/auth.store';
  import { ENV } from '../../core/config/env';

  interface Props {
    open?: boolean;
    onclose?: () => void;
  }

  let { open = $bindable(false), onclose }: Props = $props();

  let query = $state('');
  let selectedIndex = $state(0);

  const actions = $derived([
    {
      id: 'dash',
      label: $t('nav.dashboard'),
      icon: '📊',
      href: '/dashboard',
      section: 'Navegación'
    },
    { id: 'macros', label: $t('nav.macros'), icon: '🔥', href: '/macros', section: 'Navegación' },
    { id: 'foods', label: $t('nav.foods'), icon: '🥑', href: '/foods', section: 'Navegación' },
    {
      id: 'recipes',
      label: $t('nav.recipes'),
      icon: '📖',
      href: '/recipes',
      section: 'Navegación'
    },
    {
      id: 'reports',
      label: $t('nav.reports'),
      icon: '📈',
      href: '/reports',
      section: 'Navegación'
    },
    { id: 'drafts', label: $t('nav.drafts'), icon: '✨', href: '/drafts', section: 'Navegación' },
    {
      id: 'settings',
      label: $t('nav.settings'),
      icon: '⚙️',
      href: '/settings',
      section: 'Navegación'
    },
    ...($isAdmin
      ? [
          {
            id: 'admin',
            label: $t('nav.admin'),
            icon: '🛡️',
            href: '/admin',
            section: 'Navegación'
          },
          {
            id: 'status',
            label: $t('nav.status'),
            icon: '🟢',
            href: '/status',
            section: 'Navegación'
          }
        ]
      : []),
    { id: 'help', label: $t('nav.help'), icon: '💡', href: '/help', section: 'Navegación' },

    // Acciones Rápidas
    {
      id: 'theme',
      label: 'Alternar Tema Claro / Oscuro',
      icon: '🌓',
      section: 'Acciones Rápidas',
      action: () => themeStore.toggle()
    },
    {
      id: 'lang',
      label: 'Cambiar Idioma (ES / EN)',
      icon: '🌐',
      section: 'Acciones Rápidas',
      action: () => toggleLocale()
    },
    ...(ENV.ENABLE_DEMO_SHORTCUTS
      ? [
          {
            id: 'demo-user',
            label: 'Activar Modo Demo Usuario',
            icon: '👤',
            section: 'Acciones Rápidas',
            action: () => {
              authStore.setDemoSession('user');
              navigateTo('/dashboard');
            }
          },
          {
            id: 'demo-admin',
            label: 'Activar Modo Demo Administrador',
            icon: '🛡️',
            section: 'Acciones Rápidas',
            action: () => {
              authStore.setDemoSession('admin');
              navigateTo('/dashboard');
            }
          }
        ]
      : [])
  ]);

  const filteredActions = $derived(
    query.trim() === ''
      ? actions
      : actions.filter(
          (a) =>
            a.label.toLowerCase().includes(query.toLowerCase()) ||
            a.section.toLowerCase().includes(query.toLowerCase())
        )
  );

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open = !open;
      query = '';
      selectedIndex = 0;
    } else if (open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredActions.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredActions.length) % filteredActions.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          executeAction(filteredActions[selectedIndex]);
        }
      }
    }
  }

  function closePalette() {
    open = false;
    query = '';
    if (onclose) onclose();
  }

  function navigateTo(url: string) {
    closePalette();
    const target = url.startsWith('http') || (base && url.startsWith(base)) ? url : `${base}${url}`;
    goto(target);
  }

  function executeAction(item: (typeof actions)[number]) {
    if (item.href) {
      navigateTo(item.href);
    } else if (item.action) {
      item.action();
      closePalette();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    role="presentation"
    onclick={closePalette}
    class="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Barra de comandos rápidos"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      class="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      <!-- Search Input -->
      <div class="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <span class="text-slate-400 text-lg pl-2">🔍</span>
        <input
          type="text"
          bind:value={query}
          placeholder="Escribe un comando o busca una sección... (ej. macros, recetas, tema)"
          class="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
        />
        <kbd
          class="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
        >
          ESC
        </kbd>
      </div>

      <!-- Results List -->
      <div class="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
        {#if filteredActions.length === 0}
          <div class="p-6 text-center text-xs text-slate-500">
            No se encontraron comandos para "{query}"
          </div>
        {:else}
          {#each filteredActions as action, idx (action.id)}
            <button
              type="button"
              onclick={() => executeAction(action)}
              class="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer {selectedIndex ===
              idx
                ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
            >
              <div class="flex items-center gap-3">
                <span class="text-base select-none">{action.icon}</span>
                <span class="font-medium text-xs sm:text-sm">{action.label}</span>
              </div>
              <span class="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                {action.section}
              </span>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer Info -->
      <div
        class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between"
      >
        <span>Usa ↑ ↓ para navegar y Enter para seleccionar</span>
        <span>Atajo: Ctrl + K</span>
      </div>
    </div>
  </div>
{/if}
