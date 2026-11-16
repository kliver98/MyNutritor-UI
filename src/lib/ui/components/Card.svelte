<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    class?: string;
    headerAction?: Snippet;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    title = '',
    subtitle = '',
    class: customClass = '',
    headerAction,
    children,
    footer
  }: Props = $props();
</script>

<div
  class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden {customClass}"
>
  {#if title || headerAction}
    <div
      class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
    >
      <div>
        {#if title}
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {/if}
        {#if subtitle}
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        {/if}
      </div>
      {#if headerAction}
        {@render headerAction()}
      {/if}
    </div>
  {/if}

  <div class="p-5">
    {#if children}
      {@render children()}
    {/if}
  </div>

  {#if footer}
    <div
      class="px-5 py-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800"
    >
      {@render footer()}
    </div>
  {/if}
</div>
