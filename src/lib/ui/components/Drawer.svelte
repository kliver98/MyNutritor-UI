<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    subtitle?: string;
    widthClass?: string;
    onclose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = false,
    title = '',
    subtitle = '',
    widthClass = 'max-w-lg',
    onclose,
    children,
    footer
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open && onclose) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop con negrita suave profunda que oscurece por completo el header y el fondo -->
  <div
    role="presentation"
    onclick={onclose}
    class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md transition-all duration-200"
  ></div>

  <!-- Slide-over Drawer Panel -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label={title || 'Panel lateral'}
    class="fixed inset-y-0 right-0 z-[60] w-full {widthClass} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-250 ease-out"
  >
    <!-- Header -->
    <div
      class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
    >
      <div>
        {#if title}
          <h2 class="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {/if}
        {#if subtitle}
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        {/if}
      </div>

      <button
        type="button"
        onclick={onclose}
        class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        aria-label="Cerrar panel"
      >
        ✕
      </button>
    </div>

    <!-- Scrollable Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-4">
      {#if children}
        {@render children()}
      {/if}
    </div>

    <!-- Footer -->
    {#if footer}
      <div
        class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end gap-2"
      >
        {@render footer()}
      </div>
    {/if}
  </div>
{/if}
