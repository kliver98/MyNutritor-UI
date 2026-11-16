<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  interface Props {
    title: string;
    description?: string;
    icon?: string;
    actionLabel?: string;
    actionVariant?: 'primary' | 'secondary' | 'outline';
    onaction?: () => void;
    class?: string;
    children?: Snippet;
  }

  let {
    title,
    description = '',
    icon = '🥗',
    actionLabel = '',
    actionVariant = 'primary',
    onaction,
    class: customClass = '',
    children
  }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 {customClass}"
>
  <div
    class="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shadow-xs mb-4 select-none"
    aria-hidden="true"
  >
    {icon}
  </div>

  <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>

  {#if description}
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
      {description}
    </p>
  {/if}

  {#if actionLabel && onaction}
    <Button variant={actionVariant} size="sm" onclick={onaction}>
      {actionLabel}
    </Button>
  {/if}

  {#if children}
    <div class="mt-4">
      {@render children()}
    </div>
  {/if}
</div>
