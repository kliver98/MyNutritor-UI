<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    class?: string;
    children?: Snippet;
  }

  let { variant = 'info', title = '', class: customClass = '', children }: Props = $props();

  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-200',
    success:
      'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200',
    warning:
      'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200',
    danger:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200'
  };
</script>

<div
  role="alert"
  class="p-4 rounded-lg border text-sm flex flex-col gap-1 {variantStyles[variant]} {customClass}"
>
  {#if title}
    <h4 class="font-semibold">{title}</h4>
  {/if}
  {#if children}
    <div>
      {@render children()}
    </div>
  {/if}
</div>
