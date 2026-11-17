<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { reportsStore } from '$lib/application/reports/reports.store';
  import { currentUser } from '$lib/application/auth/auth.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import Skeleton from '$lib/ui/components/Skeleton.svelte';
  import CalorieTrendChart from '$lib/ui/features/reports/CalorieTrendChart.svelte';
  import MacroTrendChart from '$lib/ui/features/reports/MacroTrendChart.svelte';
  import MacroDistributionChart from '$lib/ui/features/reports/MacroDistributionChart.svelte';
  import DailyBreakdownTable from '$lib/ui/features/reports/DailyBreakdownTable.svelte';
  import FoodLogReport from '$lib/ui/features/reports/FoodLogReport.svelte';
  import DateRangePicker from '$lib/ui/components/DateRangePicker.svelte';
  import { getPresetStartDate } from '$lib/core/utils/calendar';
  import {
    getLocalDateStr,
    formatDisplayDate,
    formatCurrentPrintDateTime
  } from '$lib/core/utils/format';

  let activePreset = $state<'7' | '14' | '30' | 'all' | 'custom'>('7');

  let startDate = $state(getPresetStartDate(getLocalDateStr(), 7));
  let endDate = $state(getLocalDateStr());

  onMount(() => {
    reportsStore.fetchData(startDate, endDate);

    const handleAfterPrint = () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-mode-full', 'print-mode-food-only');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  });

  function applyPreset(days: '7' | '14' | '30' | 'all') {
    activePreset = days;
    endDate = getLocalDateStr();
    if (days === 'all') {
      startDate = '2020-01-01';
    } else {
      startDate = getPresetStartDate(endDate, Number(days));
    }
    reportsStore.setDateRange(startDate, endDate);
  }

  function handleCustomRangeApplied(start: string, end: string) {
    activePreset = 'custom';
    startDate = start;
    endDate = end;
    reportsStore.setDateRange(start, end);
  }

  async function handlePrintFull() {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('print-mode-food-only');
      document.body.classList.add('print-mode-full');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prepare-full-print'));
    }
    await tick();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  }

  const calculated = $derived($reportsStore.currentCalculated);
  const profileName = $derived(
    $currentUser?.fullName || $currentUser?.username || 'Usuario MyNutritor'
  );
</script>

<div class="space-y-6">
  <!-- ENCABEZADO DE IMPRESIÓN DEL REPORTE COMPLETO (Visible ÚNICAMENTE en impresión del botón 1) -->
  <div class="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-slate-900 print-full-only">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-black uppercase tracking-tight">
          MyNutritor • Reporte Nutricional y Adherencia
        </h1>
        <p class="text-sm font-semibold mt-1">
          Perfil del Reporte: <span class="font-bold">{profileName}</span>
        </p>
      </div>
      <div class="text-right text-xs text-slate-600 space-y-1">
        <p><b>Generado:</b> {formatCurrentPrintDateTime()}</p>
        <p><b>Período Analizado:</b> {formatDisplayDate(startDate)} al {formatDisplayDate(endDate)}</p>
        <p><b>Días con registro:</b> {calculated?.daysWithData ?? 0} de {calculated?.daysInRange ?? 0} días</p>
      </div>
    </div>
  </div>

  <!-- Top Header & Actions (Tarjeta elevada con alto contraste y consistencia visual) -->
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden"
  >
    <div class="flex items-center gap-3.5">
      <div
        class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-2xl shrink-0 shadow-2xs"
      >
        📊
      </div>
      <div>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {$t('reports.title')}
        </h1>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
          {$t('reports.subtitle')}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <Button variant="outline" size="sm" onclick={handlePrintFull}>
        🖨️ {$t('reports.printBtn')}
      </Button>
    </div>
  </div>

  <!-- Date Range Filter Bar (Default 7 days) -->
  <Card class="print:hidden">
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

      <!-- Custom Date Range Calendar Picker (Tipo Booking / Aerolíneas) -->
      <DateRangePicker
        bind:startDate
        bind:endDate
        maxDays={60}
        label="Personalizado:"
        isActive={activePreset === 'custom'}
        onchange={handleCustomRangeApplied}
      />
    </div>
  </Card>

  <!-- Content Loading vs Empty vs Data View -->
  {#if $reportsStore.isLoading}
    <div class="space-y-4">
      <Skeleton height="h-28" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton height="h-64" />
        <Skeleton height="h-64" />
      </div>
    </div>
  {:else if !calculated || calculated.daysWithData === 0}
    <EmptyState
      title={$t('reports.emptyTitle')}
      description="No se encontraron registros nutricionales en el rango de fechas seleccionado."
      icon="📊"
      actionLabel="Ver últimos 7 días"
      onaction={() => applyPreset('7')}
    />
  {:else}
    <!-- SECCIÓN DE ANALÍTICA Y ADHERENCIA (Visible en pantalla y al imprimir con el Botón 1 de Reporte Completo) -->
    <div class="print-full-only space-y-6">
      <!-- Summary Metric KPI Cards (4 cards) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid print:grid-cols-4 print:gap-3">
        <!-- Promedio Calorías -->
        <Card class="border-t-4 border-t-amber-500 print:border print:border-slate-300 print:shadow-none">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider"
              >Promedio Calórico</span
            >
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600"
            >
              {calculated.summary.averageCalories} kcal
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {calculated.summary.averageCalories}
            <span class="text-xs font-normal text-slate-400">/ día</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1">
            Meta objetivo: {calculated.targets.targetCalories} kcal
          </p>
        </Card>

        <!-- Promedio Proteína -->
        <Card class="border-t-4 border-t-blue-500 print:border print:border-slate-300 print:shadow-none">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider"
              >Promedio Proteína</span
            >
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600"
            >
              {calculated.summary.averageProtein}g
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {calculated.summary.averageProtein}g
            <span class="text-xs font-normal text-slate-400">/ día</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1">
            Meta objetivo: {calculated.targets.targetProtein}g
          </p>
        </Card>

        <!-- Promedio Carbos -->
        <Card class="border-t-4 border-t-emerald-500 print:border print:border-slate-300 print:shadow-none">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider"
              >Promedio Carbos</span
            >
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
            >
              {calculated.summary.averageCarbs}g
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {calculated.summary.averageCarbs}g
            <span class="text-xs font-normal text-slate-400">/ día</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1">
            Meta objetivo: {calculated.targets.targetCarbs}g
          </p>
        </Card>

        <!-- Adherencia al Plan -->
        <Card class="border-t-4 border-t-purple-500 print:border print:border-slate-300 print:shadow-none">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Adherencia</span>
            <span
              class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600"
            >
              {calculated.adherencePercent}%
            </span>
          </div>
          <p class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {calculated.adherencePercent}%
          </p>
          <p class="text-[11px] text-slate-400 mt-1">
            {calculated.daysWithData} de {calculated.daysInRange} días registrados
          </p>
        </Card>
      </div>

      <!-- Charts Section (Gráficos Interactivos) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid print:grid-cols-2 print:gap-4 print:break-inside-avoid">
        <div class="space-y-2">
          <h3 class="font-bold text-sm text-slate-900 dark:text-white px-1">
            Tendencia de Calorías vs Meta
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
      <div class="space-y-2 print:break-inside-avoid">
        <h3 class="font-bold text-sm text-slate-900 dark:text-white px-1">
          Consumo Diario de Macronutrientes (Proteína, Carbohidratos y Grasas)
        </h3>
        <MacroTrendChart records={calculated.dailyRecords} />
      </div>

      <!-- Daily Breakdown Table -->
      <div class="print:block print:break-inside-avoid">
        <DailyBreakdownTable records={calculated.dailyRecords} />
      </div>
    </div>
  {/if}

  <!-- SECCIÓN: REPORTE DETALLADO DE COMIDAS REGISTRADAS (Reemplaza 'Informes Guardados') -->
  <FoodLogReport />
</div>
