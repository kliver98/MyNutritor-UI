<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    form?: string;
    class?: string;
    title?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    form,
    class: customClass = '',
    title,
    onclick,
    children
  }: Props = $props();

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  const variantStyles = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-xs focus:ring-slate-900 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:focus:ring-white border border-slate-900/10 dark:border-white/20',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700',
    outline:
      'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-slate-400 bg-white/80 dark:bg-slate-900/80',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500 dark:bg-rose-600 dark:hover:bg-rose-700',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-400'
  };
</script>

<button
  {type}
  {form}
  disabled={disabled || loading}
  class="{baseStyles} {sizeStyles[size]} {variantStyles[variant]} {customClass}"
  {title}
  {onclick}
>
  {#if loading}
    <svg
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
