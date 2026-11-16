<script lang="ts">
  import type { DailyMacro } from '$lib/domain/users/UserManagement';
  import { getLocalDateStr, getYesterdayDateStr } from '$lib/core/utils/format';
  import { t } from '$lib/core/i18n/i18n.store';

  interface Props {
    selectedDate: string;
    history?: DailyMacro[];
    onselect: (date: string) => void;
  }

  let { selectedDate, history = [], onselect }: Props = $props();

  const todayStr = getLocalDateStr();
  const yesterdayStr = getYesterdayDateStr();

  const currentRecord = $derived(history.find((h) => h.date === selectedDate));
</script>

<div class="flex flex-wrap items-center gap-2">
  <!-- Today / Yesterday Buttons -->
  <div
    class="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
  >
    <button
      type="button"
      onclick={() => onselect(todayStr)}
      class="px-3 py-1.5 rounded-md cursor-pointer transition-colors {selectedDate === todayStr
        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
    >
      {$t('common.today')}
    </button>
    <button
      type="button"
      onclick={() => onselect(yesterdayStr)}
      class="px-3 py-1.5 rounded-md cursor-pointer transition-colors {selectedDate === yesterdayStr
        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
    >
      {$t('common.yesterday')}
    </button>
  </div>

  <!-- Selector rápido de fechas con registro -->
  {#if history.length > 0}
    <select
      aria-label={$t('dashboard.selectDateWithRecord')}
      value={selectedDate}
      onchange={(e) => onselect(e.currentTarget.value)}
      class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
    >
      <option value="" disabled>{$t('dashboard.datesWithRecord', { count: history.length })}</option
      >
      {#each history as item (item.date)}
        <option value={item.date}>
          {item.date} — {item.calories} kcal
        </option>
      {/each}
    </select>
  {/if}

  <!-- Selector nativo de fecha -->
  <input
    type="date"
    aria-label={$t('dashboard.dateSelector')}
    value={selectedDate}
    onchange={(e) => onselect(e.currentTarget.value)}
    class="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
  />

  {#if currentRecord}
    <span
      class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg"
    >
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      {$t('dashboard.loggedCalories', { calories: currentRecord.calories })}
    </span>
  {/if}
</div>
