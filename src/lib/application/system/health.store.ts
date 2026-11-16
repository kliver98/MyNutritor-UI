import { writable } from 'svelte/store';
import type { HealthStatus, RootSystemInfo } from '../../domain/system/Health';
import { repositories } from '../../infrastructure/container';

export interface SystemHealthState {
  health: HealthStatus | null;
  rootInfo: RootSystemInfo | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

function createHealthStore() {
  const { subscribe, set, update } = writable<SystemHealthState>({
    health: null,
    rootInfo: null,
    isLoading: false,
    error: null,
    lastChecked: null
  });

  return {
    subscribe,

    async checkHealth(): Promise<void> {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const [health, rootInfo] = await Promise.allSettled([
          repositories.system.getHealth(),
          repositories.system.getRootInfo()
        ]);

        const healthData = health.status === 'fulfilled' ? health.value : null;
        const rootData = rootInfo.status === 'fulfilled' ? rootInfo.value : null;

        const errorMsg =
          health.status === 'rejected'
            ? (health.reason as Error)?.message || 'Error al conectar con /health'
            : null;

        set({
          health: healthData,
          rootInfo: rootData,
          isLoading: false,
          error: errorMsg,
          lastChecked: new Date()
        });
      } catch (err: unknown) {
        set({
          health: null,
          rootInfo: null,
          isLoading: false,
          error: (err as Error)?.message || 'Fallo general al verificar salud del sistema',
          lastChecked: new Date()
        });
      }
    }
  };
}

export const healthStore = createHealthStore();
