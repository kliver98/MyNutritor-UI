<script lang="ts">
  import { base } from '$app/paths';
  import { currentUser, isAdmin } from '../../../application/auth/auth.store';
  import Card from '../../components/Card.svelte';
  import Badge from '../../components/Badge.svelte';
  import Button from '../../components/Button.svelte';

  // Métricas de muestra reactivas
  const todayMacros = {
    calories: 1840,
    targetCalories: 2200,
    protein: 135,
    targetProtein: 160,
    carbs: 180,
    targetCarbs: 220,
    fats: 58,
    targetFats: 70
  };
</script>

<div class="space-y-6">
  <!-- Header Banner -->
  <div
    class="p-6 rounded-2xl bg-gradient-to-r from-brand-600 via-emerald-600 to-teal-700 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
  >
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold">
          ¡Hola, {$currentUser?.fullName || $currentUser?.username || 'Usuario'}!
        </h1>
        <span
          class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white uppercase tracking-wider"
        >
          {$currentUser?.role || 'user'}
        </span>
      </div>
      <p class="text-brand-100 text-sm">
        Resumen nutricional diario y acceso rápido a tus recetas y alimentos.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <a href="{base}/macros">
        <Button variant="secondary" size="sm">+ Registrar Macros</Button>
      </a>
      <a href="{base}/recipes">
        <Button variant="outline" size="sm" class="border-white/40 text-white hover:bg-white/10">
          Ver Recetas
        </Button>
      </a>
    </div>
  </div>

  <!-- Macro Progress Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Calorías -->
    <Card class="border-l-4 border-l-amber-500">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Calorías Totales</p>
      <div class="mt-2 flex items-baseline justify-between">
        <span class="text-2xl font-bold text-slate-900 dark:text-white">{todayMacros.calories}</span
        >
        <span class="text-xs text-slate-400">de {todayMacros.targetCalories} kcal</span>
      </div>
      <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-amber-500 h-2 rounded-full"
          style="width: {(todayMacros.calories / todayMacros.targetCalories) * 100}%"
        ></div>
      </div>
    </Card>

    <!-- Proteína -->
    <Card class="border-l-4 border-l-blue-500">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Proteína</p>
      <div class="mt-2 flex items-baseline justify-between">
        <span class="text-2xl font-bold text-slate-900 dark:text-white">{todayMacros.protein}g</span
        >
        <span class="text-xs text-slate-400">de {todayMacros.targetProtein}g</span>
      </div>
      <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-blue-500 h-2 rounded-full"
          style="width: {(todayMacros.protein / todayMacros.targetProtein) * 100}%"
        ></div>
      </div>
    </Card>

    <!-- Carbohidratos -->
    <Card class="border-l-4 border-l-emerald-500">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Carbohidratos</p>
      <div class="mt-2 flex items-baseline justify-between">
        <span class="text-2xl font-bold text-slate-900 dark:text-white">{todayMacros.carbs}g</span>
        <span class="text-xs text-slate-400">de {todayMacros.targetCarbs}g</span>
      </div>
      <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-emerald-500 h-2 rounded-full"
          style="width: {(todayMacros.carbs / todayMacros.targetCarbs) * 100}%"
        ></div>
      </div>
    </Card>

    <!-- Grasas -->
    <Card class="border-l-4 border-l-rose-500">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Grasas</p>
      <div class="mt-2 flex items-baseline justify-between">
        <span class="text-2xl font-bold text-slate-900 dark:text-white">{todayMacros.fats}g</span>
        <span class="text-xs text-slate-400">de {todayMacros.targetFats}g</span>
      </div>
      <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-rose-500 h-2 rounded-full"
          style="width: {(todayMacros.fats / todayMacros.targetFats) * 100}%"
        ></div>
      </div>
    </Card>
  </div>

  <!-- Role Admin Specific Section -->
  {#if $isAdmin}
    <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Panel de Control de Administración
        </h2>
        <Badge variant="warning" size="sm">Exclusivo Admin</Badge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Gestión de Usuarios" subtitle="Cuentas y accesos">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Consulta y administra cuentas de usuario y asignación de roles.
          </p>
          <a href="{base}/admin/users">
            <Button variant="outline" size="sm" class="w-full">Administrar Usuarios</Button>
          </a>
        </Card>

        <Card title="Roles y Permisos" subtitle="Políticas de seguridad">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Configura los perfiles de acceso y permisos del sistema.
          </p>
          <a href="{base}/admin/roles">
            <Button variant="outline" size="sm" class="w-full">Configurar Roles</Button>
          </a>
        </Card>

        <Card title="Copias de Respaldo" subtitle="Seguridad y datos">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Exporta copias de seguridad de la información o restaura respaldos.
          </p>
          <a href="{base}/admin/backups">
            <Button variant="outline" size="sm" class="w-full">Ir a Backups</Button>
          </a>
        </Card>
      </div>
    </div>
  {/if}
</div>
