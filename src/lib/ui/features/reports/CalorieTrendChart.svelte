<script lang="ts">
  import type { DailyMacro } from '$lib/domain/users/UserManagement';
  import { formatShortDate } from '$lib/core/utils/format';

  interface Props {
    records: DailyMacro[];
    targetCalories?: number;
  }

  let { records = [], targetCalories = 2200 }: Props = $props();

  let activeRecord = $state<DailyMacro | null>(null);

  const width = 640;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxCal = $derived(
    Math.max(targetCalories * 1.25, ...records.map((r) => r.calories || 0), 500)
  );

  const targetY = $derived(paddingTop + chartHeight - (targetCalories / maxCal) * chartHeight);

  const barWidth = $derived(
    records.length > 0 ? Math.min(48, Math.max(16, (chartWidth / records.length) * 0.6)) : 30
  );

  function getBarX(index: number): number {
    if (records.length === 1) return paddingLeft + chartWidth / 2 - barWidth / 2;
    const step = chartWidth / records.length;
    return paddingLeft + index * step + (step - barWidth) / 2;
  }

  function getBarHeight(calories: number): number {
    return Math.max(4, (calories / maxCal) * chartHeight);
  }

  function getBarY(calories: number): number {
    return paddingTop + chartHeight - getBarHeight(calories);
  }
</script>

<div
  class="relative w-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
>
  <div class="flex items-center justify-between mb-3 text-xs">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-sm bg-amber-500 inline-block"></span>
      <span class="text-slate-600 dark:text-slate-400 font-medium">Consumo Diario</span>
      <span class="w-3 h-3 rounded-sm bg-rose-500 inline-block ml-2"></span>
      <span class="text-slate-600 dark:text-slate-400 font-medium">Excedido</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
      <span class="text-slate-500 font-medium">Meta ({targetCalories} kcal)</span>
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
        aria-label="Gráfico de evolución calórica vs meta"
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
          {Math.round(maxCal)}
        </text>
        <text
          x={paddingLeft - 8}
          y={paddingTop + chartHeight / 2 + 4}
          text-anchor="end"
          class="text-[10px] fill-slate-400 font-mono"
        >
          {Math.round(maxCal / 2)}
        </text>
        <text
          x={paddingLeft - 8}
          y={paddingTop + chartHeight + 4}
          text-anchor="end"
          class="text-[10px] fill-slate-400 font-mono"
        >
          0
        </text>

        <!-- Target Line -->
        <line
          x1={paddingLeft}
          y1={targetY}
          x2={width - paddingRight}
          y2={targetY}
          stroke="#94a3b8"
          stroke-dasharray="4 4"
          stroke-width="2"
        />

        <!-- Bars -->
        {#each records as rec, i (rec.date)}
          {@const x = getBarX(i)}
          {@const y = getBarY(rec.calories)}
          {@const h = getBarHeight(rec.calories)}
          {@const isOver = rec.calories > (rec.targetCalories || targetCalories)}

          <!-- Bar group with hover interaction -->
          <g
            tabindex="0"
            role="button"
            aria-label="{rec.date}: {rec.calories} kcal"
            class="cursor-pointer transition-opacity group"
            onmouseenter={() => (activeRecord = rec)}
            onmouseleave={() => (activeRecord = null)}
            onfocus={() => (activeRecord = rec)}
            onblur={() => (activeRecord = null)}
          >
            <!-- Bar -->
            <rect
              {x}
              {y}
              width={barWidth}
              height={h}
              rx="4"
              class="{isOver
                ? 'fill-rose-500 hover:fill-rose-600'
                : 'fill-amber-500 hover:fill-amber-600'} transition-all"
            />

            <!-- Top Value Label -->
            <text
              x={x + barWidth / 2}
              y={y - 6}
              text-anchor="middle"
              class="text-[10px] font-mono font-bold {isOver
                ? 'fill-rose-600 dark:fill-rose-400'
                : 'fill-slate-700 dark:fill-slate-300'}"
            >
              {rec.calories}
            </text>

            <!-- X Axis Date Label -->
            <text
              x={x + barWidth / 2}
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

  <!-- Tooltip overlay -->
  {#if activeRecord}
    <div
      class="mt-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between shadow-lg"
    >
      <div>
        <span class="font-bold">{activeRecord.date}</span>
        <span class="text-slate-400 ml-2"
          >Consumido: <b class="text-white">{activeRecord.calories} kcal</b></span
        >
      </div>
      <div>
        <span class="text-slate-400"
          >Meta: {activeRecord.targetCalories || targetCalories} kcal</span
        >
        <span
          class="ml-2 font-bold {activeRecord.calories >
          (activeRecord.targetCalories || targetCalories)
            ? 'text-rose-400'
            : 'text-emerald-400'}"
        >
          {activeRecord.calories > (activeRecord.targetCalories || targetCalories)
            ? `+${activeRecord.calories - (activeRecord.targetCalories || targetCalories)} kcal`
            : `${(activeRecord.targetCalories || targetCalories) - activeRecord.calories} kcal restantes`}
        </span>
      </div>
    </div>
  {/if}
</div>
