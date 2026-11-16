<script lang="ts">
  import { roundToDecimals } from '$lib/core/utils/format';

  interface Props {
    avgProtein: number;
    avgCarbs: number;
    avgFats: number;
  }

  let { avgProtein = 0, avgCarbs = 0, avgFats = 0 }: Props = $props();

  const proteinKcal = $derived(avgProtein * 4);
  const carbsKcal = $derived(avgCarbs * 4);
  const fatsKcal = $derived(avgFats * 9);
  const totalMacroKcal = $derived(proteinKcal + carbsKcal + fatsKcal || 1);

  const proteinPct = $derived(Math.round((proteinKcal / totalMacroKcal) * 100));
  const carbsPct = $derived(Math.round((carbsKcal / totalMacroKcal) * 100));
  const fatsPct = $derived(Math.max(0, 100 - proteinPct - carbsPct));
</script>

<div
  class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs"
>
  <div class="flex items-center justify-between mb-4">
    <h3 class="font-bold text-sm text-slate-900 dark:text-white">
      Distribución Calórica de Macronutrientes
    </h3>
    <span class="text-xs text-slate-400">Promedio del período</span>
  </div>

  <!-- Segmented distribution bar -->
  <div class="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
    <div
      class="h-full bg-blue-500 transition-all duration-500"
      style="width: {proteinPct}%"
      title="Proteína: {proteinPct}%"
    ></div>
    <div
      class="h-full bg-emerald-500 transition-all duration-500"
      style="width: {carbsPct}%"
      title="Carbohidratos: {carbsPct}%"
    ></div>
    <div
      class="h-full bg-rose-500 transition-all duration-500"
      style="width: {fatsPct}%"
      title="Grasas: {fatsPct}%"
    ></div>
  </div>

  <!-- Detailed Metric Cards -->
  <div class="grid grid-cols-3 gap-3 mt-4 text-center">
    <div
      class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60"
    >
      <div
        class="flex items-center justify-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1"
      >
        <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
        Proteína
      </div>
      <p class="text-lg font-black text-blue-950 dark:text-blue-100">{proteinPct}%</p>
      <p class="text-[11px] text-slate-500 mt-0.5">
        {roundToDecimals(avgProtein, 2)}g ({Math.round(proteinKcal)} kcal)
      </p>
    </div>

    <div
      class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60"
    >
      <div
        class="flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        Carbohidratos
      </div>
      <p class="text-lg font-black text-emerald-950 dark:text-emerald-100">{carbsPct}%</p>
      <p class="text-[11px] text-slate-500 mt-0.5">
        {roundToDecimals(avgCarbs, 2)}g ({Math.round(carbsKcal)} kcal)
      </p>
    </div>

    <div
      class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60"
    >
      <div
        class="flex items-center justify-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 font-semibold mb-1"
      >
        <span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
        Grasas
      </div>
      <p class="text-lg font-black text-rose-950 dark:text-rose-100">{fatsPct}%</p>
      <p class="text-[11px] text-slate-500 mt-0.5">
        {roundToDecimals(avgFats, 2)}g ({Math.round(fatsKcal)} kcal)
      </p>
    </div>
  </div>
</div>
