<script lang="ts">
  import type { DailyMacro } from '$lib/domain/users/UserManagement';
  import { formatShortDate, roundToDecimals } from '$lib/core/utils/format';

  interface Props {
    records: DailyMacro[];
  }

  let { records = [] }: Props = $props();

  let activeRecord = $state<DailyMacro | null>(null);

  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxGram = $derived(
    Math.max(
      ...records.map((r) => Math.max(r.proteinGrams || 0, r.carbsGrams || 0, r.fatsGrams || 0)),
      100
    ) * 1.15
  );

  const slotWidth = $derived(records.length > 0 ? chartWidth / records.length : 50);
  const barWidth = $derived(Math.min(14, Math.max(6, (slotWidth - 10) / 3)));

  function getBarHeight(grams: number): number {
    return Math.max(3, (grams / maxGram) * chartHeight);
  }

  function getBarY(grams: number): number {
    return paddingTop + chartHeight - getBarHeight(grams);
  }
</script>

<div
  class="relative w-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
>
  <div class="flex items-center justify-between mb-3 text-xs">
    <span class="font-bold text-slate-800 dark:text-slate-200">Macronutrientes por Día (g)</span>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
        <span class="text-slate-600 dark:text-slate-400 font-medium">Proteína</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
        <span class="text-slate-600 dark:text-slate-400 font-medium">Carbos</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
        <span class="text-slate-600 dark:text-slate-400 font-medium">Grasas</span>
      </div>
    </div>
  </div>

  {#if records.length === 0}
    <div class="h-48 flex items-center justify-center text-xs text-slate-400">
      No hay datos para graficar en este rango
    </div>
  {:else}
    <div class="w-full overflow-x-auto">
      <svg
        viewBox="0 0 {width} {height}"
        class="w-full h-auto min-w-[500px]"
        role="img"
        aria-label="Gráfico de evolución de macronutrientes"
      >
        <!-- Horizontal Grid Lines -->
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={width - paddingRight}
          y2={paddingTop}
          stroke="currentColor"
          class="text-slate-100 dark:text-slate-800"
          stroke-width="1"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight / 2}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight / 2}
          stroke="currentColor"
          class="text-slate-100 dark:text-slate-800"
          stroke-width="1"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="currentColor"
          class="text-slate-200 dark:text-slate-700"
          stroke-width="1"
        />

        <!-- Y Axis Labels -->
        <text
          x={paddingLeft - 8}
          y={paddingTop + 4}
          text-anchor="end"
          class="text-[10px] fill-slate-400 font-mono"
        >
          {Math.round(maxGram)}g
        </text>
        <text
          x={paddingLeft - 8}
          y={paddingTop + chartHeight / 2 + 4}
          text-anchor="end"
          class="text-[10px] fill-slate-400 font-mono"
        >
          {Math.round(maxGram / 2)}g
        </text>
        <text
          x={paddingLeft - 8}
          y={paddingTop + chartHeight + 4}
          text-anchor="end"
          class="text-[10px] fill-slate-400 font-mono"
        >
          0g
        </text>

        <!-- Grouped Bars -->
        {#each records as rec, i (rec.date)}
          {@const slotX = paddingLeft + i * slotWidth}
          {@const groupWidth = barWidth * 3 + 4}
          {@const startX = slotX + (slotWidth - groupWidth) / 2}

          {@const proteinX = startX}
          {@const proteinY = getBarY(rec.proteinGrams)}
          {@const proteinH = getBarHeight(rec.proteinGrams)}

          {@const carbsX = startX + barWidth + 2}
          {@const carbsY = getBarY(rec.carbsGrams)}
          {@const carbsH = getBarHeight(rec.carbsGrams)}

          {@const fatsX = startX + (barWidth + 2) * 2}
          {@const fatsY = getBarY(rec.fatsGrams)}
          {@const fatsH = getBarHeight(rec.fatsGrams)}

          <g
            tabindex="0"
            role="button"
            aria-label="{rec.date}: P {rec.proteinGrams}g, C {rec.carbsGrams}g, G {rec.fatsGrams}g"
            class="cursor-pointer transition-opacity group"
            onmouseenter={() => (activeRecord = rec)}
            onmouseleave={() => (activeRecord = null)}
            onfocus={() => (activeRecord = rec)}
            onblur={() => (activeRecord = null)}
          >
            <!-- Protein Bar -->
            <rect
              x={proteinX}
              y={proteinY}
              width={barWidth}
              height={proteinH}
              rx="2"
              class="fill-blue-500 hover:fill-blue-600 transition-colors"
            />
            <!-- Carbs Bar -->
            <rect
              x={carbsX}
              y={carbsY}
              width={barWidth}
              height={carbsH}
              rx="2"
              class="fill-emerald-500 hover:fill-emerald-600 transition-colors"
            />
            <!-- Fats Bar -->
            <rect
              x={fatsX}
              y={fatsY}
              width={barWidth}
              height={fatsH}
              rx="2"
              class="fill-rose-500 hover:fill-rose-600 transition-colors"
            />

            <!-- X Axis Date Label -->
            <text
              x={startX + groupWidth / 2}
              y={paddingTop + chartHeight + 16}
              text-anchor="middle"
              class="text-[10px] fill-slate-500 dark:text-slate-400 font-medium"
            >
              {formatShortDate(rec.date)}
            </text>
          </g>
        {/each}
      </svg>
    </div>
  {/if}

  {#if activeRecord}
    <div
      class="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between shadow-lg"
    >
      <span class="font-bold">{activeRecord.date}</span>
      <div class="flex items-center gap-4">
        <span class="text-blue-400 font-semibold"
          >Proteína: {roundToDecimals(activeRecord.proteinGrams, 2)}g</span
        >
        <span class="text-emerald-400 font-semibold"
          >Carbos: {roundToDecimals(activeRecord.carbsGrams, 2)}g</span
        >
        <span class="text-rose-400 font-semibold"
          >Grasas: {roundToDecimals(activeRecord.fatsGrams, 2)}g</span
        >
      </div>
    </div>
  {/if}
</div>
