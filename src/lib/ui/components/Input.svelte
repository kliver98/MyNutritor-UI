<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props {
    id?: string;
    name?: string;
    label?: string;
    type?: string;
    value?: string | number;
    placeholder?: string;
    error?: string | null;
    helperText?: string;
    required?: boolean;
    disabled?: boolean;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    class?: string;
    oninput?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    id,
    name,
    label = '',
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    error = null,
    helperText = '',
    required = false,
    disabled = false,
    autocomplete,
    class: customClass = '',
    oninput
  }: Props = $props();

  const generatedId = $derived(
    id || (name ? `input-${name}` : `input-${Math.random().toString(36).slice(2, 9)}`)
  );
</script>

<div class="w-full min-w-0 flex flex-col gap-1.5 {customClass}">
  {#if label}
    <label for={generatedId} class="text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <input
    id={generatedId}
    {name}
    {type}
    bind:value
    {placeholder}
    {disabled}
    {required}
    {autocomplete}
    {oninput}
    class="w-full min-w-0 px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors
      placeholder:text-slate-400 dark:placeholder:text-slate-500
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800
      {error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-400'
      : 'border-slate-300 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500'}"
  />

  {#if error}
    <p class="text-xs text-red-600 dark:text-red-400">{error}</p>
  {:else if helperText}
    <p class="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
  {/if}
</div>
