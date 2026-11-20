<script lang="ts">
  import { onMount } from 'svelte';
  import { adminStore } from '$lib/application/admin/admin.store';
  import { isAdmin, authStore } from '$lib/application/auth/auth.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import RefreshButton from '$lib/ui/components/RefreshButton.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Badge from '$lib/ui/components/Badge.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import Alert from '$lib/ui/components/Alert.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import { ENV } from '$lib/core/config/env';
  import type { User } from '$lib/domain/auth/User';
  import type { RestoreMode } from '$lib/domain/backup/Backup';

  let activeTab = $state<'users' | 'roles' | 'settings' | 'backups'>('users');

  // Backup restore modal state
  let isRestoreModalOpen = $state(false);
  let restoreMode = $state<RestoreMode>('ADD_NEW_ONLY');
  let restoreConfirmationText = $state('');
  let restoreJsonData = $state('');

  // Delete user confirmation modal state
  let isDeleteUserModalOpen = $state(false);
  let userToDelete = $state<User | null>(null);
  let isDeletingUser = $state(false);

  function confirmDeleteUser(user: User) {
    userToDelete = user;
    isDeleteUserModalOpen = true;
  }

  async function handleExecuteDeleteUser() {
    if (!userToDelete || isDeletingUser) return;
    isDeletingUser = true;
    try {
      await adminStore.deleteUser(userToDelete.username);
      isDeleteUserModalOpen = false;
      userToDelete = null;
    } finally {
      isDeletingUser = false;
    }
  }

  function cancelDeleteUser() {
    isDeleteUserModalOpen = false;
    userToDelete = null;
  }

  onMount(() => {
    if ($isAdmin) {
      adminStore.fetchAllAdminData();
    }
  });

  async function handleExecuteRestore() {
    if (restoreConfirmationText.trim().toUpperCase() !== 'CONFIRMAR') {
      return;
    }
    try {
      const parsedData = JSON.parse(restoreJsonData);
      await adminStore.restoreBackup(parsedData, restoreMode);
      isRestoreModalOpen = false;
      restoreConfirmationText = '';
    } catch {
      // JSON parse error handled by error toast or alert
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-black text-slate-900 dark:text-white">{$t('admin.title')}</h1>
        <Badge variant="warning" size="sm">Admin Role</Badge>
      </div>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('admin.subtitle')}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <RefreshButton variant="button" />
    </div>
  </div>

  {#if !$isAdmin}
    <div class="max-w-xl mx-auto py-10">
      <Alert variant="warning" title={$t('admin.accessDenied')}>
        <p class="mt-1 text-xs">
          Esta sección está restringida exclusivamente a usuarios con rol de Administrador
          (`admin`).
        </p>
        {#if ENV.ENABLE_DEMO_SHORTCUTS}
          <div class="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onclick={() => {
                authStore.setDemoSession('admin');
                adminStore.fetchAllAdminData();
              }}
            >
              🛡️ Activar Sesión de Administrador Demo
            </Button>
          </div>
        {/if}
      </Alert>
    </div>
  {:else}
    <!-- Tabs Nav -->
    <div
      class="flex flex-wrap gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
    >
      <button
        type="button"
        onclick={() => (activeTab = 'users')}
        class="px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
        'users'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
      >
        👥 {$t('admin.tabUsers')} ({$adminStore.users.length})
      </button>

      <button
        type="button"
        onclick={() => (activeTab = 'roles')}
        class="px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
        'roles'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
      >
        🛡️ {$t('admin.tabRoles')} ({$adminStore.roles.length})
      </button>

      <button
        type="button"
        onclick={() => (activeTab = 'settings')}
        class="px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
        'settings'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
      >
        📱 {$t('admin.tabSettings')}
      </button>

      <button
        type="button"
        onclick={() => (activeTab = 'backups')}
        class="px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors {activeTab ===
        'backups'
          ? 'bg-brand-600 text-white shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
      >
        💾 {$t('admin.tabBackups')}
      </button>
    </div>

    <!-- Tab 1: Users Management -->
    {#if activeTab === 'users'}
      <Card
        title="Cuentas de Usuario del Sistema"
        subtitle="Catálogo de usuarios registrados en Google Cloud Run"
      >
        {#if $adminStore.isLoading && $adminStore.users.length === 0}
          <div class="space-y-2">
            <Skeleton height="h-10" />
            <Skeleton height="h-10" />
          </div>
        {:else if $adminStore.users.length === 0}
          <p class="text-xs text-slate-500 py-4 text-center">No se encontraron usuarios.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead
                class="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200 dark:border-slate-800"
              >
                <tr>
                  <th class="py-3 px-4">Usuario</th>
                  <th class="py-3 px-4">Rol</th>
                  <th class="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                {#each $adminStore.users as user (user.id)}
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td class="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {user.username}
                      {#if user.fullName}
                        <span class="block text-xs font-normal text-slate-400">{user.fullName}</span
                        >
                      {/if}
                    </td>
                    <td class="py-3 px-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'neutral'} size="sm">
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <button
                        type="button"
                        onclick={() => confirmDeleteUser(user)}
                        class="text-red-500 hover:text-red-700 p-1 text-xs font-semibold cursor-pointer transition-colors"
                        title="Eliminar usuario {user.username}"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </Card>
    {/if}

    <!-- Tab 2: Roles -->
    {#if activeTab === 'roles'}
      <Card
        title="Definición de Roles"
        subtitle="Gestión de roles y matriz de permisos del sistema"
      >
        {#if $adminStore.roles.length === 0}
          <div class="space-y-3">
            <div
              class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">admin</h4>
                <p class="text-xs text-slate-500">
                  Acceso total a todos los módulos y operaciones administrativas.
                </p>
              </div>
              <Badge variant="warning" size="sm">Sistema</Badge>
            </div>
            <div
              class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">user</h4>
                <p class="text-xs text-slate-500">
                  Gestión de macros propios, recetas, alimentos y ajustes personales.
                </p>
              </div>
              <Badge variant="neutral" size="sm">Estándar</Badge>
            </div>
          </div>
        {:else}
          <div class="space-y-3">
            {#each $adminStore.roles as role (role.id)}
              <div
                class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white">{role.name}</h4>
                  <p class="text-xs text-slate-500">{role.description}</p>
                </div>
                <div class="flex gap-1">
                  {#each role.permissions as perm}
                    <Badge variant="info" size="sm">{perm}</Badge>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {/if}

    <!-- Tab 3: Mobile Settings & Feature Flags -->
    {#if activeTab === 'settings'}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card
          title="Configuración de App Móvil"
          subtitle="Documento de Firestore: `app_settings/mobile`"
        >
          <div class="space-y-4">
            <Input
              label="Nombre de la Aplicación (appName)"
              value={$adminStore.mobileSettings?.appName || 'MyNutritor'}
              disabled
            />
            <Input
              label="Versión Actual (currentVersion)"
              value={$adminStore.mobileSettings?.currentVersion || 'v1.6.25'}
              disabled
            />
            <Input
              label="Tema por Defecto (defaultTheme)"
              value={$adminStore.mobileSettings?.defaultTheme || 'LIGHT'}
              disabled
            />
          </div>
        </Card>

        <Card
          title="Banderas de Características (Feature Flags)"
          subtitle="Interruptores de funcionalidad móvil registrados en el backend"
        >
          <div class="space-y-3">
            <div
              class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
            >
              <div>
                <p class="text-xs font-bold text-slate-900 dark:text-white">
                  google_sign_in_enabled
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Permite iniciar sesión con cuentas de Google en la app móvil.
                </p>
              </div>
              <Badge
                variant={$adminStore.mobileSettings?.featureFlags?.google_sign_in_enabled
                  ? 'success'
                  : 'neutral'}
              >
                {$adminStore.mobileSettings?.featureFlags?.google_sign_in_enabled
                  ? 'Habilitado'
                  : 'Deshabilitado'}
              </Badge>
            </div>

            <div
              class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
            >
              <div>
                <p class="text-xs font-bold text-slate-900 dark:text-white">work_offline_enabled</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Permite la sincronización y registro local sin conexión a internet.
                </p>
              </div>
              <Badge
                variant={$adminStore.mobileSettings?.featureFlags?.work_offline_enabled
                  ? 'success'
                  : 'neutral'}
              >
                {$adminStore.mobileSettings?.featureFlags?.work_offline_enabled
                  ? 'Habilitado'
                  : 'Deshabilitado'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    {/if}

    <!-- Tab 4: Backups & Restore -->
    {#if activeTab === 'backups'}
      <Card
        title="Copias de Seguridad y Recuperación de Desastres"
        subtitle="Endpoint: `/api/v1/backup`"
      >
        <div class="space-y-6">
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
          >
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                Generar Respaldo de Colecciones
              </h4>
              <p class="text-xs text-slate-500">
                Empaqueta todas las tablas y colecciones de la base de datos en un archivo JSON
                descargable.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" onclick={() => (isRestoreModalOpen = true)}>
                {$t('admin.restoreBackupBtn')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={$adminStore.isLoading}
                onclick={() => adminStore.generateBackup()}
              >
                {$t('admin.generateBackupBtn')}
              </Button>
            </div>
          </div>

          <!-- Last generated backup token link -->
          {#if $adminStore.lastBackupResult}
            <div
              class="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 space-y-2"
            >
              <div class="flex items-center gap-2 font-bold text-sm">
                <span>✓</span> Respaldo Generado con Éxito
              </div>
              <p class="text-xs leading-relaxed">
                Token temporal: <code
                  class="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded"
                  >{$adminStore.lastBackupResult.token}</code
                >
              </p>
              <a
                href={adminStore.getDownloadUrl($adminStore.lastBackupResult.token)}
                target="_blank"
                rel="noreferrer"
                class="inline-block mt-2 text-xs font-bold underline"
              >
                📥 Descargar Archivo JSON de Respaldo ↗
              </a>
            </div>
          {/if}

          <!-- Collections table -->
          {#if $adminStore.backupCollections.length > 0}
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Colecciones Disponibles
              </h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {#each $adminStore.backupCollections as col}
                  <div
                    class="p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-center"
                  >
                    <p class="font-bold text-sm">{col.name}</p>
                    <span class="text-xs text-slate-400">{col.count} registros</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </Card>
    {/if}
  {/if}

  <!-- Restore Modal with Double Confirmation -->
  <Modal
    open={isRestoreModalOpen}
    title={$t('admin.restoreBackupBtn')}
    subtitle="Procedimiento de restauración de base de datos"
    onclose={() => (isRestoreModalOpen = false)}
  >
    <div class="space-y-4">
      <Alert variant="danger" title="Acción Crítica">
        La restauración de datos alterará la información existente en la base de datos de Cloud Run.
      </Alert>

      <div class="space-y-2">
        <label
          for="restore-mode-select"
          class="text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          {$t('admin.restoreModeTitle')}
        </label>
        <select
          id="restore-mode-select"
          bind:value={restoreMode}
          class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="ADD_NEW_ONLY">{$t('admin.addNewMode')}</option>
          <option value="REPLACE_ALL">{$t('admin.replaceMode')}</option>
        </select>
      </div>

      <div class="space-y-1">
        <label
          for="restore-data-area"
          class="text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          Datos JSON a Restaurar
        </label>
        <textarea
          id="restore-data-area"
          bind:value={restoreJsonData}
          placeholder={`{\n  "users": [],\n  "recipes": []\n}`}
          rows="4"
          class="w-full p-2.5 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        ></textarea>
      </div>

      <div class="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
        <Input
          label={$t('admin.confirmRestoreNotice')}
          placeholder="Escribe CONFIRMAR"
          bind:value={restoreConfirmationText}
          required
        />
      </div>
    </div>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isRestoreModalOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={restoreConfirmationText.trim().toUpperCase() !== 'CONFIRMAR'}
        loading={$adminStore.isLoading}
        onclick={handleExecuteRestore}
      >
        Ejecutar Restauración
      </Button>
    {/snippet}
  </Modal>

  <!-- Delete User Confirmation Modal -->
  <Modal
    open={isDeleteUserModalOpen}
    title="¿Eliminar cuenta de usuario?"
    subtitle="Esta acción no se puede deshacer"
    onclose={cancelDeleteUser}
  >
    <div class="space-y-3">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        ¿Estás seguro de que deseas eliminar permanentemente al usuario <strong
          class="text-slate-900 dark:text-white">{userToDelete?.username}</strong
        >?
      </p>
      {#if userToDelete?.fullName}
        <p class="text-xs text-slate-500">
          Nombre: <span class="font-medium text-slate-700 dark:text-slate-300"
            >{userToDelete.fullName}</span
          >
        </p>
      {/if}
      <div
        class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-start gap-2"
      >
        <span>⚠️</span>
        <span
          >Se eliminarán permanentemente todos sus registros nutricionales, recetas y
          configuraciones asociadas.</span
        >
      </div>
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelDeleteUser}>
          {$t('common.cancel')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          loading={isDeletingUser}
          onclick={handleExecuteDeleteUser}
        >
          Eliminar usuario
        </Button>
      </div>
    {/snippet}
  </Modal>
</div>
