<script lang="ts">
  import { base } from '$app/paths';
  import type { DailyMacro } from '$lib/domain/users/UserManagement';
  import { formatDisplayDate, roundToDecimals } from '$lib/core/utils/format';
  import { macrosStore } from '$lib/application/macros/macros.store';

  interface Props {
    records: DailyMacro[];
  }

  let { records = [] }: Props = $props();

  // Mostrar registros ordenados del más reciente al más antiguo
  const sorted = $derived([...records].sort((a, b) => b.date.localeCompare(a.date)));
</script>

<div
  class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
>
  <div
    class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
  >
    <h3 class="font-bold text-sm text-slate-900 dark:text-white">
      Desglose Diario de Registros ({records.length}
      {records.length === 1 ? 'día' : 'días'})
    </h3>
    <span class="text-xs text-slate-400">Datos obtenidos de la API</span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-xs text-left">
      <thead
        class="bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800"
      >
        <tr>
          <th class="px-4 py-3">Fecha</th>
          <th class="px-4 py-3">Calorías</th>
          <th class="px-4 py-3">Proteína</th>
          <th class="px-4 py-3">Carbohidratos</th>
          <th class="px-4 py-3">Grasas</th>
          <th class="px-4 py-3">Estado</th>
          <th class="px-4 py-3 text-right">Acción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        {#each sorted as rec (rec.date)}
          {@const target = rec.targetCalories || 2200}
          {@const isOver = rec.calories > target}
          <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
              {formatDisplayDate(rec.date)}
            </td>
            <td class="px-4 py-3 font-mono font-bold">
              {rec.calories} <span class="text-slate-400 font-normal">/ {target} kcal</span>
            </td>
            <td class="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
              {roundToDecimals(rec.proteinGrams, 2)}g
            </td>
            <td class="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">
              {roundToDecimals(rec.carbsGrams, 2)}g
            </td>
            <td class="px-4 py-3 font-mono text-rose-600 dark:text-rose-400">
              {roundToDecimals(rec.fatsGrams, 2)}g
            </td>
            <td class="px-4 py-3">
              {#if isOver}
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  Excedido (+{rec.calories - target} kcal)
                </span>
              {:else}
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  ✓ En meta
                </span>
              {/if}
            </td>
            <td class="px-4 py-3 text-right">
              <a
                href="{base}/dashboard"
                onclick={() => macrosStore.setDate(rec.date)}
                class="text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Ver en Dashboard →
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
