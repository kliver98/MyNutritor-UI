<script lang="ts">
  import type { MealBreakdownItem } from '$lib/domain/reports/MealReportFormat';

  interface Props {
    items: MealBreakdownItem[];
    onupdateamount: (index: number, newAmount: number) => void;
    onremove: (index: number) => void;
  }

  let { items, onupdateamount, onremove }: Props = $props();
</script>

<div class="space-y-2">
  <div
    class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300"
  >
    <span>Alimentos e Ingredientes ({items.length})</span>
    <span class="text-[11px] font-normal text-slate-400">Ajusta las cantidades en gramos</span>
  </div>

  {#if items.length === 0}
    <div
      class="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500"
    >
      <span class="text-xl block mb-1">🥗</span>
      Selecciona uno o más alimentos o carga una receta para armar el plato.
    </div>
  {:else}
    <div class="max-h-52 overflow-y-auto space-y-2 pr-1">
      {#each items as item, index}
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-2"
        >
          <!-- Información del ítem -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-slate-400 font-mono">{index + 1}.</span>
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                {item.name}
              </p>
              {#if item.brand}
                <span class="text-[10px] text-slate-400 font-normal truncate">
                  ({item.brand})
                </span>
              {/if}
            </div>
            <!-- Macros calculados del ítem -->
            <div
              class="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono"
            >
              <span class="font-bold text-slate-700 dark:text-slate-300"
                >{Math.round(item.calories)} kcal</span
              >
              <span>•</span>
              <span class="text-blue-600 dark:text-blue-400">P: {item.proteinGrams}g</span>
              <span>•</span>
              <span class="text-purple-600 dark:text-purple-400">G: {item.fatsGrams}g</span>
              <span>•</span>
              <span class="text-emerald-600 dark:text-emerald-400">C: {item.carbsGrams}g</span>
            </div>
          </div>

          <!-- Input de cantidad y botón borrar -->
          <div class="flex items-center gap-2 self-end sm:self-center">
            <div class="relative flex items-center">
              <input
                type="number"
                min="1"
                max="5000"
                value={item.amount}
                oninput={(e) =>
                  onupdateamount(index, Number((e.target as HTMLInputElement).value) || 0)}
                class="w-18 px-2 py-1 text-xs font-mono font-bold rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right pr-6 focus:ring-1 focus:ring-brand-500"
              />
              <span class="absolute right-2 text-[10px] text-slate-400 pointer-events-none">
                {item.unit || 'g'}
              </span>
            </div>

            <button
              type="button"
              onclick={() => onremove(index)}
              title="Quitar alimento"
              class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
