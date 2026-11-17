<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    foodLogsStore,
    groupedFoodLogs,
    foodLogPeriodTotals
  } from '$lib/application/reports/food-logs.store';
  import { reportsStore } from '$lib/application/reports/reports.store';
  import { currentUser } from '$lib/application/auth/auth.store';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Modal from '$lib/ui/components/Modal.svelte';
  import EmptyState from '$lib/ui/components/EmptyState.svelte';
  import MealLogModal from '../meals/MealLogModal.svelte';
  import DateRangePicker from '$lib/ui/components/DateRangePicker.svelte';
  import type { FoodLogItem } from '$lib/domain/reports/FoodLog';
  import { formatDisplayDate, formatCurrentPrintDateTime } from '$lib/core/utils/format';
  import { toastStore } from '$lib/core/feedback/toast.store';

  // Modal de registrar comida con selector de alimentos, recetas y cálculo de impacto
  let isAddModalOpen = $state(false);

  // Modal de detalle de desglose de elementos de la comida
  let selectedDetailItem = $state<FoodLogItem | null>(null);

  // Estado de dropdowns expandidos por reporte
  let expandedReportIds = $state<Set<string>>(new Set());

  // Modal de confirmación de eliminación (Regla de negocio obligatoria)
  let isDeleteModalOpen = $state(false);
  let itemToDelete = $state<FoodLogItem | null>(null);

  // Fecha y hora calculada para la impresión
  let printTimestamp = $state('');

  onMount(() => {
    // Sincronizar con el historial de macros y reportes de Firestore
    if ($reportsStore.dailyMacros.length > 0 || $reportsStore.reports.length > 0) {
      foodLogsStore.syncWithHistory($reportsStore.dailyMacros, $reportsStore.reports);
    }

    const handleBeforePrint = () => {
      expandedReportIds = new Set(allItemIds);
      printTimestamp = formatCurrentPrintDateTime();
    };

    const handleAfterPrint = () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-mode-full', 'print-mode-food-only');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeprint', handleBeforePrint);
      window.addEventListener('prepare-full-print', handleBeforePrint);
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('prepare-full-print', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  });

  // Re-sincronizar si cambian dailyMacros o reports en reportsStore
  $effect(() => {
    if ($reportsStore.dailyMacros.length > 0 || $reportsStore.reports.length > 0) {
      foodLogsStore.syncWithHistory($reportsStore.dailyMacros, $reportsStore.reports);
    }
  });

  function handlePresetChange(preset: '7' | '14') {
    foodLogsStore.setPreset(preset);
  }

  function openAddModal() {
    isAddModalOpen = true;
  }

  function toggleDropdown(id: string) {
    const next = new Set(expandedReportIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedReportIds = next;
  }

  const allItemIds = $derived($groupedFoodLogs.flatMap((g) => g.items.map((i) => i.id)));

  const isAllExpanded = $derived(
    allItemIds.length > 0 && allItemIds.every((id) => expandedReportIds.has(id))
  );

  function toggleAllDropdowns() {
    if (isAllExpanded) {
      expandedReportIds = new Set();
    } else {
      expandedReportIds = new Set(allItemIds);
    }
  }

  function confirmDelete(item: FoodLogItem) {
    itemToDelete = item;
    isDeleteModalOpen = true;
  }

  function executeDelete() {
    if (itemToDelete) {
      foodLogsStore.deleteLog(itemToDelete.id);
      itemToDelete = null;
    }
    isDeleteModalOpen = false;
  }

  function cancelDelete() {
    itemToDelete = null;
    isDeleteModalOpen = false;
  }

  async function handlePrintFoodOnly() {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('print-mode-full');
      document.body.classList.add('print-mode-food-only');
    }
    // Al imprimir/exportar solo comidas, forzar la expansión de todos los reportes
    expandedReportIds = new Set(allItemIds);
    printTimestamp = formatCurrentPrintDateTime();
    await tick();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  }

  const profileName = $derived(
    $currentUser?.fullName || $currentUser?.username || 'Usuario MyNutritor'
  );
</script>

<section class="space-y-6">
  <!-- ENCABEZADO DE IMPRESIÓN (Visible ÚNICAMENTE en el modo de solo comidas, omitido en vista web normal y en reporte completo) -->
  <div
    class="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-slate-900 food-only-header"
  >
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-black uppercase tracking-tight">
          MyNutritor • Reporte de Alimentos Registrados
        </h1>
        <p class="text-sm font-semibold mt-1">
          Perfil del Reporte: <span class="font-bold">{profileName}</span>
        </p>
      </div>
      <div class="text-right text-xs text-slate-600 space-y-1">
        <p>
          <b>Generado:</b>
          {printTimestamp || formatCurrentPrintDateTime()}
        </p>
        <p>
          <b>Período:</b>
          {formatDisplayDate($foodLogsStore.startDate)} al {formatDisplayDate(
            $foodLogsStore.endDate
          )}
        </p>
        <p><b>Días con registro:</b> {$foodLogPeriodTotals.totalDays} días</p>
      </div>
    </div>
  </div>

  <!-- SUB-ENCABEZADO DE SECCIÓN EN REPORTE COMPLETO (Visible cuando se imprime todo el informe nutricional) -->
  <div
    class="hidden print:block my-4 pt-4 border-t-2 border-slate-300 text-slate-900 food-report-section-title"
  >
    <h2 class="text-xl font-black uppercase tracking-tight">
      📋 Desglose Detallado de Comidas Registradas
    </h2>
    <p class="text-xs text-slate-600 font-medium">
      Historial de alimentos consumidos agrupados por día con cantidades, macronutrientes y hora.
    </p>
  </div>

  <!-- ENCABEZADO DE LA VISTA EN PANTALLA (Tarjeta elevada con alto contraste y teoría de color) -->
  <div
    class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden"
  >
    <div class="flex items-center gap-3.5">
      <div
        class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl shrink-0 shadow-2xs"
      >
        📋
      </div>
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Reporte de Alimentos Registrados
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
          Historial detallado de comidas agrupadas por día con cantidades, macronutrientes y hora de
          registro.
        </p>
      </div>
    </div>

    <!-- Acciones de cabecera -->
    <div class="flex flex-wrap items-center gap-2 shrink-0">
      <Button variant="ghost" size="sm" onclick={toggleAllDropdowns}>
        {isAllExpanded ? '📁 Colapsar Alimentos' : '📂 Expandir Todos los Alimentos'}
      </Button>
      <Button variant="outline" size="sm" onclick={openAddModal}>+ Registrar Comida</Button>
      <Button variant="primary" size="sm" onclick={handlePrintFoodOnly}>🖨️ Imprimir Reporte</Button>
    </div>
  </div>

  <!-- SELECTOR DE RANGO DE FECHAS (3 opciones obligatorias: 7 días, 14 días y Personalizado máx 2 meses) -->
  <Card class="print:hidden">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mr-1"
          >Rango de Comidas:</span
        >

        <!-- Opción 1: 7 días -->
        <button
          type="button"
          onclick={() => handlePresetChange('7')}
          class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer {$foodLogsStore.preset ===
          '7'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'}"
        >
          Últimos 7 días
        </button>

        <!-- Opción 2: 14 días -->
        <button
          type="button"
          onclick={() => handlePresetChange('14')}
          class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer {$foodLogsStore.preset ===
          '14'
            ? 'bg-brand-600 text-white shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'}"
        >
          Últimos 14 días
        </button>

        <!-- Opción 3: Personalizado con calendario interactivo tipo Booking/Aerolíneas -->
        <DateRangePicker
          startDate={$foodLogsStore.startDate}
          endDate={$foodLogsStore.endDate}
          maxDays={60}
          buttonText="Personalizado (Máx 2 meses)"
          isActive={$foodLogsStore.preset === 'custom'}
          onchange={(start, end) => {
            const ok = foodLogsStore.setCustomRange(start, end);
            if (ok) {
              toastStore.success(
                `Filtro aplicado: ${formatDisplayDate(start)} al ${formatDisplayDate(end)}`
              );
            }
          }}
        />
      </div>
    </div>

    <!-- Advertencia si el rango personalizado supera los 60 días -->
    {#if $foodLogsStore.validationError}
      <div
        class="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2"
      >
        <span>⚠️</span>
        <span>{$foodLogsStore.validationError}</span>
      </div>
    {/if}
  </Card>

  <!-- RESUMEN DEL PERÍODO (En pantalla, oculto en impresión para eliminar redundancia) -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
    <div
      class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs print:border-slate-400"
    >
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
        >Calorías Período</span
      >
      <p class="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-0.5">
        {$foodLogPeriodTotals.totalCalories}
        <span class="text-xs font-normal text-slate-400">kcal</span>
      </p>
    </div>

    <div
      class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs print:border-slate-400"
    >
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
        >Proteína Total</span
      >
      <p class="text-xl sm:text-2xl font-black text-blue-600 font-mono mt-0.5">
        {$foodLogPeriodTotals.totalProtein}
        <span class="text-xs font-normal text-slate-400">g</span>
      </p>
    </div>

    <div
      class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs print:border-slate-400"
    >
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
        >Carbohidratos Total</span
      >
      <p class="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5">
        {$foodLogPeriodTotals.totalCarbs} <span class="text-xs font-normal text-slate-400">g</span>
      </p>
    </div>

    <div
      class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs print:border-slate-400"
    >
      <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
        >Grasas Total</span
      >
      <p class="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-0.5">
        {$foodLogPeriodTotals.totalFats} <span class="text-xs font-normal text-slate-400">g</span>
      </p>
    </div>
  </div>

  <!-- LISTADO DE COMIDAS AGRUPADAS POR DÍA -->
  {#if $groupedFoodLogs.length === 0}
    <EmptyState
      title="No hay registros de comidas en este rango"
      description="Selecciona otro rango de fechas o añade un nuevo registro de alimentos."
      icon="🍽️"
      actionLabel="+ Registrar Comida"
      onaction={openAddModal}
    />
  {:else}
    <div class="space-y-4">
      {#each $groupedFoodLogs as dayGroup (dayGroup.date)}
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs break-inside-avoid print:border-slate-400 print:shadow-none"
        >
          <!-- Encabezado del Día con Totales del Día -->
          <div
            class="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">📅</span>
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">
                {dayGroup.displayDate}
              </h3>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-mono"
                >({dayGroup.date})</span
              >
            </div>

            <!-- Totales del Día con badges de alto contraste -->
            <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span
                class="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold"
              >
                {dayGroup.totalCalories} kcal
              </span>
              <span
                class="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-semibold"
              >
                P: {dayGroup.totalProteinGrams}g
              </span>
              <span
                class="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-semibold"
              >
                C: {dayGroup.totalCarbsGrams}g
              </span>
              <span
                class="px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-semibold"
              >
                G: {dayGroup.totalFatsGrams}g
              </span>
            </div>
          </div>

          <!-- Tabla de Alimentos / Comidas de este Día -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead
                class="text-[11px] uppercase bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800"
              >
                <tr>
                  <th class="py-2.5 px-3 min-w-[180px]">Alimento / Comida</th>
                  <th class="py-2.5 px-3 min-w-[100px]">Cantidad</th>
                  <th class="py-2.5 px-3 min-w-[80px]">Hora</th>
                  <th class="py-2.5 px-3 text-right">Calorías</th>
                  <th class="py-2.5 px-3 text-right">Proteína</th>
                  <th class="py-2.5 px-3 text-right">Carbos</th>
                  <th class="py-2.5 px-3 text-right">Grasas</th>
                  <th class="py-2.5 px-3 text-right print:hidden">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                {#each dayGroup.items as item (item.id)}
                  <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <!-- Título con botón dropdown para desplegar alimentos consumidos -->
                    <td class="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      <div class="space-y-1.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span>{item.title}</span>
                        </div>

                        <!-- Dropdown toggle button -->
                        <button
                          type="button"
                          onclick={() => toggleDropdown(item.id)}
                          class="print:hidden inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 cursor-pointer transition-colors"
                          aria-expanded={expandedReportIds.has(item.id)}
                        >
                          {#if expandedReportIds.has(item.id)}
                            <span>▲ Ocultar alimentos</span>
                          {:else}
                            <span>▼ Ver alimentos</span>
                            <span
                              class="px-1.5 py-0.2 rounded-full text-[10px] bg-brand-200 dark:bg-brand-900 text-brand-800 dark:text-brand-200 font-mono font-bold"
                            >
                              {item.items?.length || 1}
                            </span>
                          {/if}
                        </button>
                      </div>
                    </td>

                    <!-- Cantidad del registro -->
                    <td class="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {item.amount}
                      {item.unit}
                    </td>

                    <!-- Hora real retornada por el alimento o reporte (sin horarios genéricos inventados) -->
                    <td
                      class="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap"
                    >
                      {#if item.time}
                        <span class="font-bold text-slate-800 dark:text-slate-200"
                          >🕐 {item.time}</span
                        >
                      {:else}
                        <span class="text-slate-500 dark:text-slate-400">--:--</span>
                      {/if}
                    </td>

                    <!-- Macros -->
                    <td class="py-2.5 px-3 text-right font-mono font-bold text-amber-600">
                      {item.calories} kcal
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-blue-600">
                      {item.proteinGrams}g
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-emerald-600">
                      {item.carbsGrams}g
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono text-rose-600">
                      {item.fatsGrams}g
                    </td>

                    <!-- Acciones (Ocultas en impresión) -->
                    <td class="py-2.5 px-3 text-right print:hidden whitespace-nowrap">
                      <button
                        type="button"
                        onclick={() => confirmDelete(item)}
                        class="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                        title="Eliminar este alimento del registro"
                        aria-label="Eliminar alimento {item.title}"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>

                  <!-- FILA DESPLEGABLE: ALIMENTOS CONSUMIDOS EN ESTE REPORTE (Auto-expandido en impresión) -->
                  <tr
                    class="{expandedReportIds.has(item.id)
                      ? ''
                      : 'hidden'} print:!table-row print-expand-all bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800"
                  >
                    <td colspan="8" class="p-3 sm:px-4 sm:py-3.5">
                      <div class="space-y-2">
                        <div
                          class="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/60"
                        >
                          <h4
                            class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            <span>🥗</span> Alimentos Consumidos ({item.items?.length || 1})
                          </h4>
                          <span class="text-[11px] text-slate-500 font-mono">
                            {item.title} • {item.time ? `🕐 ${item.time}` : 'Hora no registrada'}
                          </span>
                        </div>

                        {#if item.items && item.items.length > 0}
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {#each item.items as elem, idx}
                              <div
                                class="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs"
                              >
                                <div class="min-w-0 flex-1 pr-2">
                                  <div class="flex items-center gap-1.5">
                                    <span class="font-bold text-slate-400 font-mono text-[11px]"
                                      >{idx + 1}.</span
                                    >
                                    <span class="font-bold text-slate-900 dark:text-white truncate"
                                      >{elem.name}</span
                                    >
                                  </div>
                                  <p class="text-[10px] text-slate-400 truncate ml-4">
                                    {elem.brand || 'General Promedio'}
                                  </p>
                                </div>
                                <div class="text-right whitespace-nowrap">
                                  <div class="flex items-center justify-end gap-2">
                                    <span
                                      class="font-semibold text-slate-700 dark:text-slate-300 font-mono"
                                    >
                                      {elem.amount}{elem.unit || 'g'}
                                    </span>
                                    <span class="font-bold text-amber-600 font-mono">
                                      {elem.calories} kcal
                                    </span>
                                  </div>
                                  <div
                                    class="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-x-1.5 mt-0.5"
                                  >
                                    <span class="text-blue-600 dark:text-blue-400"
                                      >P:{elem.proteinGrams}g</span
                                    >
                                    <span class="text-rose-600 dark:text-rose-400"
                                      >G:{elem.fatsGrams}g</span
                                    >
                                    <span class="text-emerald-600 dark:text-emerald-400"
                                      >C:{elem.carbsGrams}g</span
                                    >
                                  </div>
                                </div>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <!-- Vista unificada para reportes que no cuentan con desglose individual de ingredientes -->
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div
                              class="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs"
                            >
                              <div class="min-w-0 flex-1 pr-2">
                                <div class="flex items-center gap-1.5">
                                  <span class="font-bold text-slate-400 font-mono text-[11px]"
                                    >1.</span
                                  >
                                  <span class="font-bold text-slate-900 dark:text-white truncate"
                                    >{item.title}</span
                                  >
                                </div>
                                <p class="text-[10px] text-slate-400 truncate ml-4">
                                  Plato registrado
                                </p>
                              </div>
                              <div class="text-right whitespace-nowrap">
                                <div class="flex items-center justify-end gap-2">
                                  <span
                                    class="font-semibold text-slate-700 dark:text-slate-300 font-mono"
                                  >
                                    {item.amount}{item.unit || 'porción'}
                                  </span>
                                  <span class="font-bold text-amber-600 font-mono">
                                    {item.calories} kcal
                                  </span>
                                </div>
                                <div
                                  class="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-x-1.5 mt-0.5"
                                >
                                  <span class="text-blue-600 dark:text-blue-400"
                                    >P:{item.proteinGrams}g</span
                                  >
                                  <span class="text-rose-600 dark:text-rose-400"
                                    >G:{item.fatsGrams}g</span
                                  >
                                  <span class="text-emerald-600 dark:text-emerald-400"
                                    >C:{item.carbsGrams}g</span
                                  >
                                </div>
                              </div>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- MODAL: REGISTRAR COMIDA CON ALIMENTOS, RECETAS E IMPACTO DEL DÍA -->
  <MealLogModal open={isAddModalOpen} onclose={() => (isAddModalOpen = false)} />

  <!-- MODAL: DESGLOSE DETALLADO DE ELEMENTOS DEL PLATO -->
  <Modal
    open={Boolean(selectedDetailItem)}
    title={selectedDetailItem?.title || 'Detalle del Plato'}
    subtitle={`Registrado el ${formatDisplayDate(selectedDetailItem?.date || '')} a las ${selectedDetailItem?.time || ''}`}
    maxWidthClass="max-w-xl"
    onclose={() => (selectedDetailItem = null)}
  >
    {#if selectedDetailItem}
      <div class="space-y-4">
        <!-- Resumen de Macros -->
        <div
          class="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
        >
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Calorías</p>
            <p class="text-sm font-black text-amber-600 mt-0.5">
              {selectedDetailItem.calories} kcal
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Proteína</p>
            <p class="text-sm font-black text-blue-600 mt-0.5">
              {selectedDetailItem.proteinGrams}g
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Carbos</p>
            <p class="text-sm font-black text-emerald-600 mt-0.5">
              {selectedDetailItem.carbsGrams}g
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase font-bold text-slate-400">Grasas</p>
            <p class="text-sm font-black text-rose-600 mt-0.5">{selectedDetailItem.fatsGrams}g</p>
          </div>
        </div>

        <!-- Desglose de Alimentos -->
        {#if selectedDetailItem.items && selectedDetailItem.items.length > 0}
          <div class="space-y-2">
            <h4
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Desglose de Alimentos Consumidos ({selectedDetailItem.items.length})
            </h4>
            <div class="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {#each selectedDetailItem.items as elem, idx}
                <div class="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white"
                      >{idx + 1}. {elem.name}</span
                    >
                    <span class="text-slate-400 text-[10px] ml-1">({elem.brand || 'General'})</span>
                    <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                      P: {elem.proteinGrams}g • G: {elem.fatsGrams}g • C: {elem.carbsGrams}g
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="font-semibold text-slate-700 dark:text-slate-300"
                      >{elem.amount}{elem.unit || 'g'}</span
                    >
                    <p class="font-mono font-bold text-amber-600 text-[11px]">
                      {elem.calories} kcal
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else if selectedDetailItem.rawMarkdown}
          <div class="space-y-1">
            <h4
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Contenido del Reporte Guardado
            </h4>
            <pre
              class="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-60">{selectedDetailItem.rawMarkdown}</pre>
          </div>
        {/if}
      </div>
    {/if}

    {#snippet footer()}
      <Button variant="outline" size="sm" onclick={() => (selectedDetailItem = null)}>Cerrar</Button
      >
    {/snippet}
  </Modal>

  <!-- MODAL: CONFIRMACIÓN DE ELIMINACIÓN (Regla de negocio obligatoria) -->
  <Modal
    open={isDeleteModalOpen}
    title="¿Eliminar este registro de comida?"
    subtitle="Esta acción no se puede deshacer"
    onclose={cancelDelete}
  >
    <div class="space-y-3">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        ¿Estás seguro de que deseas eliminar <strong class="text-slate-900 dark:text-white"
          >{itemToDelete?.title}</strong
        >
        ({itemToDelete?.amount}{itemToDelete?.unit}) registrado a las {itemToDelete?.time}?
      </p>
      <div
        class="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-start gap-2"
      >
        <span>⚠️</span>
        <span>El registro será removido permanentemente de este informe nutricional.</span>
      </div>
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelDelete}>Cancelar</Button>
        <Button variant="danger" size="sm" onclick={executeDelete}>Eliminar</Button>
      </div>
    {/snippet}
  </Modal>
</section>
