<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    subtitle?: string;
    maxWidthClass?: string;
    onclose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = false,
    title = '',
    subtitle = '',
    maxWidthClass = 'max-w-md',
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
  <!-- Backdrop -->
  <div
    role="presentation"
    onclick={onclose}
    class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity"
  >
    <!-- Modal Window -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Ventana emergente'}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      class="relative z-[60] w-full {maxWidthClass} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      {#if title}
        <div
          class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
        >
          <div>
            <h3 class="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
            {#if subtitle}
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            {/if}
          </div>
          <button
            type="button"
            onclick={onclose}
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
      {/if}

      <div class="p-6 overflow-y-auto space-y-4">
        {#if children}
          {@render children()}
        {/if}
      </div>

      {#if footer}
        <div
          class="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2"
        >
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
