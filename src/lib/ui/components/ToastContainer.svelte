<script lang="ts">
  import { toastStore, type ToastItem } from '../../core/feedback/toast.store';

  const typeStyles: Record<
    ToastItem['type'],
    { bg: string; border: string; text: string; icon: string }
  > = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/90',
      border: 'border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/90',
      border: 'border-red-300 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: '✕'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/90',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-100',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/90',
      border: 'border-blue-300 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'ℹ'
    }
  };
</script>

<div
  aria-live="polite"
  aria-atomic="true"
  class="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
>
  {#each $toastStore as toast (toast.id)}
    <div
      role="alert"
      class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 transform translate-y-0 opacity-100
        {typeStyles[toast.type].bg} {typeStyles[toast.type].border} {typeStyles[toast.type].text}"
    >
      <span class="font-bold text-base select-none" aria-hidden="true">
        {typeStyles[toast.type].icon}
      </span>

      <div class="flex-1 text-xs">
        {#if toast.title}
          <h4 class="font-semibold text-sm mb-0.5">{toast.title}</h4>
        {/if}
        <p class="leading-relaxed">{toast.message}</p>

        {#if toast.action}
          <button
            type="button"
            onclick={() => {
              toast.action?.onClick();
              toastStore.remove(toast.id);
            }}
            class="mt-2 text-xs font-bold underline cursor-pointer hover:opacity-80"
          >
            {toast.action.label}
          </button>
        {/if}
      </div>

      <button
        type="button"
        onclick={() => toastStore.remove(toast.id)}
        class="opacity-60 hover:opacity-100 text-xs font-bold p-1 cursor-pointer"
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
