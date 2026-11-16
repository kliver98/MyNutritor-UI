import { writable } from 'svelte/store';
import type { User } from '../../domain/auth/User';
import type { Role } from '../../domain/roles/Role';
import type { MobileSettings, FeatureFlags } from '../../domain/settings/AppSettings';
import type {
  BackupCollectionInfo,
  BackupGenerateResult,
  RestoreMode
} from '../../domain/backup/Backup';
import { repositories } from '../../infrastructure/container';
import { toastStore } from '../../core/feedback/toast.store';

export interface AdminState {
  users: User[];
  roles: Role[];
  mobileSettings: MobileSettings | null;
  featureFlags: FeatureFlags | null;
  backupCollections: BackupCollectionInfo[];
  lastBackupResult: BackupGenerateResult | null;
  isLoading: boolean;
  error: string | null;
}

function createAdminStore() {
  const { subscribe, update } = writable<AdminState>({
    users: [],
    roles: [],
    mobileSettings: null,
    featureFlags: null,
    backupCollections: [],
    lastBackupResult: null,
    isLoading: false,
    error: null
  });

  return {
    subscribe,

    reset() {
      update(() => ({
        users: [],
        roles: [],
        mobileSettings: null,
        featureFlags: null,
        backupCollections: [],
        lastBackupResult: null,
        isLoading: false,
        error: null
      }));
    },

    async fetchAllAdminData() {
      update((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const [users, roles, mobileSettings, backupCollections] = await Promise.allSettled([
          repositories.users.getAll(),
          repositories.roles.getAll(),
          repositories.appSettings.getMobileSettings(),
          repositories.backup.getCollections()
        ]);

        update((s) => ({
          ...s,
          users: users.status === 'fulfilled' ? users.value : [],
          roles: roles.status === 'fulfilled' ? roles.value : [],
          mobileSettings: mobileSettings.status === 'fulfilled' ? mobileSettings.value : null,
          backupCollections:
            backupCollections.status === 'fulfilled' ? backupCollections.value : [],
          isLoading: false
        }));
      } catch (err: unknown) {
        update((s) => ({
          ...s,
          isLoading: false,
          error: (err as Error)?.message || 'Error al cargar datos administrativos'
        }));
      }
    },

    async deleteUser(usernameOrId: string) {
      try {
        await repositories.users.delete(usernameOrId);
        update((s) => ({
          ...s,
          users: s.users.filter((u) => u.username !== usernameOrId && u.id !== usernameOrId)
        }));
        toastStore.success('Usuario eliminado');
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al eliminar usuario');
      }
    },

    async saveMobileSettings(settings: Partial<MobileSettings>) {
      try {
        const updated = await repositories.appSettings.updateMobileSettings(settings);
        update((s) => ({ ...s, mobileSettings: updated }));
        toastStore.success('Configuración móvil actualizada');
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al guardar configuración');
      }
    },

    async patchFlags(flags: Partial<FeatureFlags>) {
      try {
        const updated = await repositories.appSettings.patchFeatureFlags(flags);
        update((s) => ({ ...s, featureFlags: updated }));
        toastStore.success('Feature flags actualizadas');
      } catch (err: unknown) {
        toastStore.error((err as Error)?.message || 'Error al actualizar flags');
      }
    },

    async generateBackup(collections?: string[]) {
      update((s) => ({ ...s, isLoading: true }));
      try {
        const res = await repositories.backup.generateBackup(collections);
        update((s) => ({ ...s, lastBackupResult: res, isLoading: false }));
        toastStore.success('Respaldo generado con éxito');
        return res;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al generar respaldo');
        throw err;
      }
    },

    getDownloadUrl(token: string) {
      return repositories.backup.getDownloadUrl(token);
    },

    async restoreBackup(backupData: unknown, mode: RestoreMode) {
      update((s) => ({ ...s, isLoading: true }));
      try {
        const res = await repositories.backup.restoreBackup(backupData, mode);
        update((s) => ({ ...s, isLoading: false }));
        toastStore.success(res.message || 'Restauración completada con éxito');
        return res;
      } catch (err: unknown) {
        update((s) => ({ ...s, isLoading: false }));
        toastStore.error((err as Error)?.message || 'Error al restaurar respaldo');
        throw err;
      }
    }
  };
}

export const adminStore = createAdminStore();
