<script lang="ts">
  import {
    SPANISH_MONTH_NAMES,
    SPANISH_WEEKDAY_SHORT,
    getMonthCalendarGrid,
    getNextMonth,
    getPrevMonth,
    parseDateString,
    getDaysDifference,
    getPresetStartDate
  } from '$lib/core/utils/calendar';
  import { formatDisplayDate, getLocalDateStr } from '$lib/core/utils/format';

  interface Props {
    startDate?: string;
    endDate?: string;
    maxDays?: number;
    maxDate?: string;
    minDate?: string;
    label?: string;
    buttonText?: string;
    isActive?: boolean;
    isOpen?: boolean;
    onchange?: (start: string, end: string) => void;
  }

  let {
    startDate = $bindable(getPresetStartDate(getLocalDateStr(), 7)),
    endDate = $bindable(getLocalDateStr()),
    maxDays = 60,
    maxDate = getLocalDateStr(),
    minDate,
    label = '',
    buttonText = '',
    isActive = false,
    isOpen = $bindable(false),
    onchange
  }: Props = $props();

  // Fechas temporales durante la selección en el calendario
  let tempStart = $state(startDate);
  let tempEnd = $state(endDate);
  let hoverDate = $state<string | null>(null);

  // Estado de selección: 'start' espera clic de fecha inicio, 'end' espera fecha fin
  let step = $state<'start' | 'end'>('start');

  // Mes base mostrado (mes izquierdo)
  const initialParsed = parseDateString(startDate || getLocalDateStr());
  let currentYear = $state(initialParsed.year);
  let currentMonth = $state(initialParsed.month);

  // Mes siguiente (mes derecho para pantallas grandes tipo Booking/Aerolíneas)
  const nextMonthInfo = $derived(getNextMonth(currentYear, currentMonth));

  const monthGridLeft = $derived(getMonthCalendarGrid(currentYear, currentMonth));
  const monthGridRight = $derived(getMonthCalendarGrid(nextMonthInfo.year, nextMonthInfo.month));

  function prevMonth() {
    const prev = getPrevMonth(currentYear, currentMonth);
    currentYear = prev.year;
    currentMonth = prev.month;
  }

  function nextMonth() {
    const next = getNextMonth(currentYear, currentMonth);
    currentYear = next.year;
    currentMonth = next.month;
  }

  export function openCalendar() {
    tempStart = startDate;
    tempEnd = endDate;
    hoverDate = null;
    step = 'start';
    const parsed = parseDateString(startDate || getLocalDateStr());
    currentYear = parsed.year;
    currentMonth = parsed.month;
    isOpen = true;
  }

  export function closeCalendar() {
    isOpen = false;
  }

  function handleDayClick(dateStr: string) {
    if (isDateDisabled(dateStr)) return;

    if (step === 'start') {
      tempStart = dateStr;
      tempEnd = '';
      step = 'end';
    } else {
      // step === 'end'
      if (dateStr < tempStart) {
        // Si hace clic en una fecha anterior, se reasigna como fecha inicio
        tempStart = dateStr;
        tempEnd = '';
        step = 'end';
      } else {
        tempEnd = dateStr;
        step = 'start';
      }
    }
  }

  function handleDayHover(dateStr: string) {
    if (step === 'end') {
      hoverDate = dateStr;
    }
  }

  function isDateDisabled(dateStr: string): boolean {
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    return false;
  }

  const calculatedDays = $derived.by(() => {
    const effectiveEnd =
      tempEnd || (step === 'end' && hoverDate && hoverDate >= tempStart ? hoverDate : '');
    if (!tempStart || !effectiveEnd) return 0;
    return getDaysDifference(tempStart, effectiveEnd);
  });

  const isRangeValid = $derived.by(() => {
    if (!tempStart || !tempEnd) return false;
    if (tempStart > tempEnd) return false;
    const diff = getDaysDifference(tempStart, tempEnd);
    return diff > 0 && diff <= maxDays;
  });

  function applyPreset(days: number) {
    const end = maxDate || getLocalDateStr();
    const start = getPresetStartDate(end, days);
    tempStart = start;
    tempEnd = end;
    step = 'start';
    const parsed = parseDateString(start);
    currentYear = parsed.year;
    currentMonth = parsed.month;
  }

  function applySelection() {
    if (!isRangeValid) return;
    const selectedStart = tempStart;
    const selectedEnd = tempEnd;

    // Cerrar el modal inmediatamente
    isOpen = false;

    // Asignar props bindeables
    startDate = selectedStart;
    endDate = selectedEnd;

    // Invocar callback de forma segura
    if (onchange) {
      try {
        onchange(selectedStart, selectedEnd);
      } catch (err) {
        console.error('Error al aplicar rango de fechas en DateRangePicker:', err);
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      closeCalendar();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Botón / Gatillo interactivo que abre el calendario visual -->
<div class="inline-flex items-center gap-2 text-xs">
  {#if label}
    <span class="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider"
      >{label}</span
    >
  {/if}

  <button
    type="button"
    onclick={openCalendar}
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer group {isActive
      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-2xs'}"
    aria-haspopup="dialog"
    aria-expanded={isOpen}
  >
    <span
      class="{isActive
        ? 'text-white'
        : 'text-brand-600 dark:text-brand-400'} group-hover:scale-110 transition-transform">📅</span
    >
    {#if buttonText}
      <span>{buttonText}</span>
      <span class="text-slate-300 dark:text-slate-600">|</span>
      <span
        class="font-mono text-[11px] {isActive
          ? 'text-brand-100'
          : 'text-slate-600 dark:text-slate-300'}"
      >
        {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
      </span>
    {:else}
      <span>{formatDisplayDate(startDate)}</span>
      <span class="{isActive ? 'text-brand-200' : 'text-slate-400'} font-normal">a</span>
      <span>{formatDisplayDate(endDate)}</span>
    {/if}
    <span
      class="ml-0.5 text-[10px] {isActive
        ? 'text-white'
        : 'text-slate-400 group-hover:text-brand-600'} transition-colors">▾</span
    >
  </button>
</div>

<!-- Modal / Ventana emergente tipo Booking & Aerolíneas con fondo oscurecido -->
{#if isOpen}
  <div
    role="presentation"
    onclick={closeCalendar}
    class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
  >
    <!-- Contenedor del Calendario -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Selector de rango de fechas"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      class="relative z-[60] w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
    >
      <!-- Cabecera del Calendario -->
      <div
        class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
      >
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-black text-slate-900 dark:text-white text-base tracking-tight">
              Seleccionar Rango de Fechas
            </h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Elige fecha de inicio y fecha fin (período máximo permitido de {maxDays} días)
          </p>
        </div>

        <button
          type="button"
          onclick={closeCalendar}
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar calendario"
        >
          ✕
        </button>
      </div>

      <!-- Resumen visual del rango seleccionado y atajos rápidos -->
      <div
        class="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <!-- Rango activo actual -->
        <div class="flex items-center gap-2 text-xs font-semibold">
          <div
            class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
          >
            <span class="text-brand-600 font-bold">Desde:</span>
            <span>{tempStart ? formatDisplayDate(tempStart) : 'Selecciona día'}</span>
          </div>
          <span class="text-slate-400">➔</span>
          <div
            class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
          >
            <span class="text-brand-600 font-bold">Hasta:</span>
            <span
              >{tempEnd
                ? formatDisplayDate(tempEnd)
                : step === 'end'
                  ? 'Elige fin...'
                  : 'Selecciona día'}</span
            >
          </div>
        </div>

        <!-- Atajos Rápidos -->
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1"
            >Rápido:</span
          >
          <button
            type="button"
            onclick={() => applyPreset(7)}
            class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            7 días
          </button>
          <button
            type="button"
            onclick={() => applyPreset(14)}
            class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            14 días
          </button>
          <button
            type="button"
            onclick={() => applyPreset(30)}
            class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            30 días
          </button>
          <button
            type="button"
            onclick={() => applyPreset(maxDays)}
            class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Máx {maxDays}d
          </button>
        </div>
      </div>

      <!-- Cuadrículas de Calendario (1 mes en móvil, 2 meses en escritorio estilo Aerolínea/Booking) -->
      <div class="p-5 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <!-- MES 1 (Izquierdo) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <button
                type="button"
                onclick={prevMonth}
                class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <h4 class="font-black text-sm text-slate-900 dark:text-white capitalize">
                {SPANISH_MONTH_NAMES[currentMonth]}
                {currentYear}
              </h4>
              <div class="w-8 md:hidden">
                <button
                  type="button"
                  onclick={nextMonth}
                  class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                  aria-label="Mes siguiente"
                >
                  ›
                </button>
              </div>
            </div>

            <!-- Cabecera Días de Semana -->
            <div
              class="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase"
            >
              {#each SPANISH_WEEKDAY_SHORT as dayName}
                <div class="py-1">{dayName}</div>
              {/each}
            </div>

            <!-- Días del Mes 1 -->
            <div class="grid grid-cols-7 gap-y-1 text-center text-xs">
              {#each monthGridLeft as day}
                {@const isDisabled = !day.isCurrentMonth || isDateDisabled(day.dateStr)}
                {@const isStart = day.isCurrentMonth && day.dateStr === tempStart}
                {@const effectiveEnd =
                  tempEnd ||
                  (step === 'end' && hoverDate && hoverDate >= tempStart ? hoverDate : '')}
                {@const isEnd = day.isCurrentMonth && day.dateStr === effectiveEnd}
                {@const isInRange =
                  day.isCurrentMonth &&
                  tempStart &&
                  effectiveEnd &&
                  day.dateStr > tempStart &&
                  day.dateStr < effectiveEnd}

                <div
                  class="relative py-1 {isInRange
                    ? 'bg-brand-50 dark:bg-brand-950/50'
                    : ''} {isStart && effectiveEnd
                    ? 'rounded-l-xl bg-brand-50 dark:bg-brand-950/50'
                    : ''} {isEnd && tempStart
                    ? 'rounded-r-xl bg-brand-50 dark:bg-brand-950/50'
                    : ''}"
                >
                  {#if !day.isCurrentMonth}
                    <div
                      class="w-8 h-8 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-700 opacity-20"
                    >
                      {day.dayNumber}
                    </div>
                  {:else}
                    <button
                      type="button"
                      disabled={isDisabled}
                      onclick={() => handleDayClick(day.dateStr)}
                      onmouseenter={() => handleDayHover(day.dateStr)}
                      class="w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-semibold transition-all {isDisabled
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : isStart || isEnd
                          ? 'bg-brand-600 text-white font-bold shadow-xs scale-105'
                          : isInRange
                            ? 'text-brand-900 dark:text-brand-100 hover:bg-brand-200 dark:hover:bg-brand-900/60 cursor-pointer'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}"
                    >
                      {day.dayNumber}
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- MES 2 (Derecho - visible en pantallas medianas y grandes) -->
          <div class="hidden md:block space-y-3">
            <div class="flex items-center justify-between px-1">
              <div></div>
              <h4 class="font-black text-sm text-slate-900 dark:text-white capitalize">
                {SPANISH_MONTH_NAMES[nextMonthInfo.month]}
                {nextMonthInfo.year}
              </h4>
              <button
                type="button"
                onclick={nextMonth}
                class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>

            <!-- Cabecera Días de Semana -->
            <div
              class="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase"
            >
              {#each SPANISH_WEEKDAY_SHORT as dayName}
                <div class="py-1">{dayName}</div>
              {/each}
            </div>

            <!-- Días del Mes 2 -->
            <div class="grid grid-cols-7 gap-y-1 text-center text-xs">
              {#each monthGridRight as day}
                {@const isDisabled = !day.isCurrentMonth || isDateDisabled(day.dateStr)}
                {@const isStart = day.isCurrentMonth && day.dateStr === tempStart}
                {@const effectiveEnd =
                  tempEnd ||
                  (step === 'end' && hoverDate && hoverDate >= tempStart ? hoverDate : '')}
                {@const isEnd = day.isCurrentMonth && day.dateStr === effectiveEnd}
                {@const isInRange =
                  day.isCurrentMonth &&
                  tempStart &&
                  effectiveEnd &&
                  day.dateStr > tempStart &&
                  day.dateStr < effectiveEnd}

                <div
                  class="relative py-1 {isInRange
                    ? 'bg-brand-50 dark:bg-brand-950/50'
                    : ''} {isStart && effectiveEnd
                    ? 'rounded-l-xl bg-brand-50 dark:bg-brand-950/50'
                    : ''} {isEnd && tempStart
                    ? 'rounded-r-xl bg-brand-50 dark:bg-brand-950/50'
                    : ''}"
                >
                  {#if !day.isCurrentMonth}
                    <div
                      class="w-8 h-8 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-700 opacity-20"
                    >
                      {day.dayNumber}
                    </div>
                  {:else}
                    <button
                      type="button"
                      disabled={isDisabled}
                      onclick={() => handleDayClick(day.dateStr)}
                      onmouseenter={() => handleDayHover(day.dateStr)}
                      class="w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-semibold transition-all {isDisabled
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : isStart || isEnd
                          ? 'bg-brand-600 text-white font-bold shadow-xs scale-105'
                          : isInRange
                            ? 'text-brand-900 dark:text-brand-100 hover:bg-brand-200 dark:hover:bg-brand-900/60 cursor-pointer'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}"
                    >
                      {day.dayNumber}
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Estado y Acciones -->
      <div
        class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <!-- Indicador de estado y validación -->
        <div>
          {#if step === 'end' && !tempEnd}
            <span
              class="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1.5"
            >
              <span>👉</span> Haz clic en el calendario para seleccionar la <b>fecha fin</b>
            </span>
          {:else if calculatedDays > maxDays}
            <span
              class="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5"
            >
              <span>⚠️</span> El rango ({calculatedDays} días) supera el límite de {maxDays} días (2 meses)
            </span>
          {:else if isRangeValid}
            <span
              class="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5"
            >
              <span>✅</span> <b>{calculatedDays} días</b> seleccionados ({formatDisplayDate(
                tempStart
              )} al {formatDisplayDate(tempEnd)})
            </span>
          {:else}
            <span class="text-xs text-slate-500">Selecciona dos fechas para definir el rango</span>
          {/if}
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={closeCalendar}
            class="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isRangeValid}
            onclick={applySelection}
            class="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Aplicar Fechas</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
