import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  durationMs?: number;
  action?: ToastAction;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastItem[]>([]);

  function remove(id: string) {
    update((items) => items.filter((item) => item.id !== id));
  }

  function show(toast: Omit<ToastItem, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.durationMs ?? (toast.type === 'error' ? 6000 : 4000);

    const newToast: ToastItem = { ...toast, id, durationMs: duration };

    update((items) => [...items, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  }

  return {
    subscribe,
    show,
    remove,
    success: (message: string, title?: string, action?: ToastAction) =>
      show({ type: 'success', message, title, action }),
    error: (message: string, title?: string, action?: ToastAction) =>
      show({ type: 'error', message, title, action }),
    warning: (message: string, title?: string, action?: ToastAction) =>
      show({ type: 'warning', message, title, action }),
    info: (message: string, title?: string, action?: ToastAction) =>
      show({ type: 'info', message, title, action }),
    clear: () => update(() => [])
  };
}

export const toastStore = createToastStore();
