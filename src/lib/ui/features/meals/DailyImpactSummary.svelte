<script lang="ts">
  import { reportsStore } from '$lib/application/reports/reports.store';
  import { formatDisplayDate, roundToDecimals } from '$lib/core/utils/format';

  interface Props {
    selectedDate: string;
    mealCalories: number;
    mealProtein: number;
    mealCarbs: number;
    mealFats: number;
  }

  let { selectedDate, mealCalories, mealProtein, mealCarbs, mealFats }: Props = $props();

  // Buscar si ya hay consumo registrado para ese día
  const existingMacro = $derived($reportsStore.dailyMacros.find((m) => m.date === selectedDate));

  const currentCal = $derived(existingMacro?.calories || 0);
  const currentP = $derived(existingMacro?.proteinGrams || 0);
  const currentC = $derived(existingMacro?.carbsGrams || 0);
  const currentF = $derived(existingMacro?.fatsGrams || 0);

  const targetCal = $derived(existingMacro?.targetCalories || 2200);
  const targetP = $derived(existingMacro?.targetProteinGrams || 160);
  const targetC = $derived(existingMacro?.targetCarbsGrams || 220);
  const targetF = $derived(existingMacro?.targetFatsGrams || 70);

  // Totales proyectados sumando esta comida
  const projectedCal = $derived(currentCal + Math.round(mealCalories));
  const projectedP = $derived(roundToDecimals(currentP + mealProtein, 1));
  const projectedC = $derived(roundToDecimals(currentC + mealCarbs, 1));
  const projectedF = $derived(roundToDecimals(currentF + mealFats, 1));

  const calPercent = $derived(Math.min(Math.round((projectedCal / targetCal) * 100), 100));
  const isOverCal = $derived(projectedCal > targetCal);
  const calDiff = $derived(Math.abs(projectedCal - targetCal));
</script>

<div
  class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4"
>
  <div
    class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700"
  >
    <div>
      <h4
        class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5"
      >
        <span>📊</span> Resumen del Día con esta Comida
      </h4>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
        {formatDisplayDate(selectedDate)}
      </p>
    </div>
    {#if isOverCal}
      <span
        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
      >
        +{calDiff} kcal sobre meta
      </span>
    {:else}
      <span
        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
      >
        Dentro de meta
      </span>
    {/if}
  </div>

  <!-- Barra de progreso de Calorías -->
  <div class="space-y-1.5">
    <div class="flex justify-between text-xs">
      <span class="font-bold text-slate-700 dark:text-slate-300">Calorías Totales</span>
      <span
        class="font-mono font-bold {isOverCal
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-slate-900 dark:text-white'}"
      >
        {projectedCal} / {targetCal}
        <span class="text-[10px] font-normal text-slate-400">kcal</span>
      </span>
    </div>
    <div class="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
      <div
        class="h-full transition-all duration-300 {isOverCal ? 'bg-amber-500' : 'bg-brand-500'}"
        style="width: {calPercent}%"
      ></div>
    </div>
    <div class="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
      <span>Previo: {currentCal} kcal</span>
      <span class="text-brand-600 dark:text-brand-400 font-semibold"
        >+{Math.round(mealCalories)} de esta comida</span
      >
    </div>
  </div>

  <!-- Desglose de Macronutrientes -->
  <div class="grid grid-cols-3 gap-2 pt-1 text-center">
    <div
      class="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
    >
      <p class="text-[10px] font-bold text-slate-400 uppercase">Proteínas</p>
      <p class="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
        {projectedP}<span class="text-[10px] font-normal text-slate-400">/{targetP}g</span>
      </p>
      <p class="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">
        +{Math.round(mealProtein)}g
      </p>
    </div>

    <div
      class="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
    >
      <p class="text-[10px] font-bold text-slate-400 uppercase">Carbos</p>
      <p class="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
        {projectedC}<span class="text-[10px] font-normal text-slate-400">/{targetC}g</span>
      </p>
      <p class="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
        +{Math.round(mealCarbs)}g
      </p>
    </div>

    <div
      class="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
    >
      <p class="text-[10px] font-bold text-slate-400 uppercase">Grasas</p>
      <p class="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
        {projectedF}<span class="text-[10px] font-normal text-slate-400">/{targetF}g</span>
      </p>
      <p class="text-[9px] text-purple-600 dark:text-purple-400 font-semibold">
        +{Math.round(mealFats)}g
      </p>
    </div>
  </div>
</div>
