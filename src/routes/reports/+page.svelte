<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { reportsStore } from '$lib/application/reports/reports.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import CalorieTrendChart from '$lib/ui/features/reports/CalorieTrendChart.svelte';
  import MacroTrendChart from '$lib/ui/features/reports/MacroTrendChart.svelte';
  import MacroDistributionChart from '$lib/ui/features/reports/MacroDistributionChart.svelte';
  import DailyBreakdownTable from '$lib/ui/features/reports/DailyBreakdownTable.svelte';
  import { getLocalDateStr, getPastDateStr, formatDisplayDate } from '$lib/core/utils/format';

  let isModalOpen = $state(false);
  let saveTitle = $state('');
  let activePreset = $state<'7' | '14' | '30' | 'all' | 'custom'>('7');

  let startDate = $state(getPastDateStr(7));
  let endDate = $state(getLocalDateStr());

  onMount(() => {
    reportsStore.fetchData(startDate, endDate);
  });

  function applyPreset(days: '7' | '14' | '30' | 'all') {
    activePreset = days;
    endDate = getLocalDateStr();
    if (days === 'all') {
      startDate = '2020-01-01';
    } else {
      startDate = getPastDateStr(Number(days));
    }
    reportsStore.setDateRange(startDate, endDate);
  }

  function handleCustomDateChange() {
    activePreset = 'custom';
    reportsStore.setDateRange(startDate, endDate);
  }

  async function handleSaveReport(e: SubmitEvent) {
    e.preventDefault();
    await reportsStore.saveCurrentReport(saveTitle);
    isModalOpen = false;
    saveTitle = '';
  }

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  const calculated = $derived($reportsStore.currentCalculated);
</script>

<div class="space-y-6">
  <!-- Top Header & Actions -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">
        {$t('reports.title')}
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {$t('reports.subtitle')}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" onclick={handlePrint}>
        🖨️ {$t('reports.printBtn')}
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={!calculated || calculated.daysWithData === 0}
        onclick={() => (isModalOpen = true)}
      >
        💾 Guardar Reporte
      </Button>
    </div>
  </div>

  <!-- Date Range Filter Bar (Default 7 days) -->
  <Card>
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <!-- Quick Range Presets -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Rango:</span>
        <button
          type="button"
          onclick={() => applyPreset('7')}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer {activePreset ===
          '7'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
        >
          Últimos 7 días
        </button>
        <button
          type="button"
          onclick={() => applyPreset('14')}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer {activePreset ===
          '14'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
        >
          Últimos 14 días
        </button>
        <button
          type="button"
          onclick={() => applyPreset('30')}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer {activePreset ===
          '30'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
        >
          Últimos 30 días
        </button>
        <button
          type="button"
          onclick={() => applyPreset('all')}
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer {activePreset ===
          'all'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}"
        >
          Todo el historial
        </button>
      </div>

      <!-- Manual Date Inputs -->
      <div class="flex items-center gap-2 text-xs">
        <div class="flex items-center gap-1.5">
          <label for="rep-start-date" class="text-slate-500">Desde:</label>
          <input
            id="rep-start-date"
            type="date"
            bind:value={startDate}
            onchange={handleCustomDateChange}
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <label for="rep-end-date" class="text-slate-500">Hasta:</label>
          <input
            id="rep-end-date"
            type="date"
            bind:value={endDate}
            onchange={handleCustomDateChange}
            class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  </Card>

  <!-- Loading State -->
  {#if $reportsStore.isLoading && !calculated}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Skeleton height="h-28" />
      <Skeleton height="h-28" />
      <Skeleton height="h-28" />
      <Skeleton height="h-28" />
    </div>
  {:else if !calculated || calculated.daysWithData === 0}
    <!-- Empty state for the date range -->
    <EmptyState
      title="No hay registros nutricionales en este rango"
      description="No se encontraron días con consumo registrado entre {formatDisplayDate(
        startDate
      )} y {formatDisplayDate(
        endDate
      )}. Prueba seleccionando otro rango de fechas o registra tus alimentos en el Dashboard."
      icon="📈"
      actionLabel="Ir al Dashboard a Registrar"
      onaction={() => goto(`${base}/dashboard`)}
    />
  {:else}
    <!-- Real KPI Cards based on API data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Promedio Calorías -->
      <Card class="border-t-4 border-t-amber-500">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>PROMEDIO CALORÍAS</span>
          <span
            class="px-2 py-0.5 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-950/60 font-mono"
          >
            {calculated.adherencePercent}% meta
          </span>
        </div>
        <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">
          {calculated.summary.averageCalories}
          <span class="text-xs text-slate-400 font-normal">kcal/día</span>
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Meta promedio: {calculated.targets.targetCalories} kcal ({calculated.daysWithData}
          {calculated.daysWithData === 1 ? 'día registrado' : 'días registrados'})
        </p>
      </Card>

      <!-- Promedio Proteína -->
      <Card class="border-t-4 border-t-blue-500">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>PROMEDIO PROTEÍNA</span>
          <span class="text-blue-500">🥩</span>
        </div>
        <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">
          {calculated.summary.averageProtein}g
          <span class="text-xs text-slate-400 font-normal">/día</span>
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Meta promedio: {calculated.targets.targetProtein}g
        </p>
      </Card>

      <!-- Promedio Carbohidratos -->
      <Card class="border-t-4 border-t-emerald-500">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>PROMEDIO CARBOS</span>
          <span class="text-emerald-500">🌾</span>
        </div>
        <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">
          {calculated.summary.averageCarbs}g
          <span class="text-xs text-slate-400 font-normal">/día</span>
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Meta promedio: {calculated.targets.targetCarbs}g
        </p>
      </Card>

      <!-- Promedio Grasas -->
      <Card class="border-t-4 border-t-rose-500">
        <div class="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>PROMEDIO GRASAS</span>
          <span class="text-rose-500">🥑</span>
        </div>
        <p class="text-3xl font-black text-slate-900 dark:text-white mt-2">
          {calculated.summary.averageFats}g
          <span class="text-xs text-slate-400 font-normal">/día</span>
        </p>
        <p class="text-[11px] text-slate-500 mt-1">
          Meta promedio: {calculated.targets.targetFats}g
        </p>
      </Card>
    </div>

    <!-- Charts Section: Calorie Evolution & Macro Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-2">
        <h3 class="font-bold text-sm text-slate-900 dark:text-white px-1">
          Evolución Calórica vs Meta ({formatDisplayDate(calculated.periodStart)} al {formatDisplayDate(
            calculated.periodEnd
          )})
        </h3>
        <CalorieTrendChart
          records={calculated.dailyRecords}
          targetCalories={calculated.targets.targetCalories}
        />
      </div>

      <div class="space-y-2">
        <h3 class="font-bold text-sm text-slate-900 dark:text-white px-1">
          Distribución de Macronutrientes
        </h3>
        <MacroDistributionChart
          avgProtein={calculated.summary.averageProtein}
          avgCarbs={calculated.summary.averageCarbs}
          avgFats={calculated.summary.averageFats}
        />
      </div>
    </div>

    <!-- Daily Macronutrients Chart -->
    <div class="space-y-2">
      <h3 class="font-bold text-sm text-slate-900 dark:text-white px-1">
        Consumo Diario de Macronutrientes (Proteína, Carbohidratos y Grasas)
      </h3>
      <MacroTrendChart records={calculated.dailyRecords} />
    </div>

    <!-- Daily Breakdown Table -->
    <DailyBreakdownTable records={calculated.dailyRecords} />
  {/if}

  <!-- Archived Reports Section from Backend -->
  {#if $reportsStore.reports.length > 0}
    <div class="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
      <h3 class="font-bold text-base text-slate-900 dark:text-white">
        Informes Guardados en el Servidor ({$reportsStore.reports.length})
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each $reportsStore.reports as rep (rep.id)}
          <Card>
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">{rep.title}</h4>
                <p class="text-xs text-slate-400 mt-0.5">
                  Período: {formatDisplayDate(rep.periodStart)} al {formatDisplayDate(
                    rep.periodEnd
                  )}
                </p>
              </div>
              <button
                type="button"
                onclick={() => reportsStore.deleteReport(rep.id)}
                class="text-rose-500 hover:text-rose-700 text-xs cursor-pointer font-medium"
              >
                {$t('common.delete')}
              </button>
            </div>
            {#if rep.summary && rep.summary.averageCalories > 0}
              <div
                class="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px]"
              >
                <div>
                  <span class="text-slate-400 block">Calorías</span>
                  <b class="text-amber-600 font-mono">{rep.summary.averageCalories}</b>
                </div>
                <div>
                  <span class="text-slate-400 block">Proteína</span>
                  <b class="text-blue-600 font-mono">{rep.summary.averageProtein}g</b>
                </div>
                <div>
                  <span class="text-slate-400 block">Carbos</span>
                  <b class="text-emerald-600 font-mono">{rep.summary.averageCarbs}g</b>
                </div>
                <div>
                  <span class="text-slate-400 block">Grasas</span>
                  <b class="text-rose-600 font-mono">{rep.summary.averageFats}g</b>
                </div>
              </div>
            {/if}
          </Card>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Save Report Modal -->
  <Modal
    open={isModalOpen}
    title="Guardar Informe en el Servidor"
    onclose={() => (isModalOpen = false)}
  >
    <form id="save-report-form" onsubmit={handleSaveReport} class="space-y-4">
      <Input
        label="Título del Informe"
        placeholder="ej. Informe Semanal {formatDisplayDate(startDate)} - {formatDisplayDate(
          endDate
        )}"
        bind:value={saveTitle}
        required
      />
      <div
        class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 space-y-1"
      >
        <p><b>Período:</b> {formatDisplayDate(startDate)} al {formatDisplayDate(endDate)}</p>
        <p><b>Días con registro:</b> {calculated?.daysWithData || 0}</p>
        <p><b>Promedio calórico:</b> {calculated?.summary.averageCalories || 0} kcal</p>
      </div>
    </form>

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (isModalOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button type="submit" form="save-report-form" variant="primary" size="sm">
        {$t('common.confirm')}
      </Button>
    {/snippet}
  </Modal>
</div>
