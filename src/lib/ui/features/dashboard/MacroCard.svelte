<script lang="ts">
  import Card from '$lib/ui/components/Card.svelte';
  import { roundToDecimals } from '$lib/core/utils/format';
  import { t } from '$lib/core/i18n/i18n.store';

  interface Props {
    title: string;
    current: number;
    target: number;
    unit?: string;
    accentColor: 'amber' | 'blue' | 'emerald' | 'rose';
    decimals?: number;
  }

  let { title, current, target, unit = 'g', accentColor, decimals = 0 }: Props = $props();

  const percent = $derived(target > 0 ? Math.round((current / target) * 100) : 0);
  const barWidth = $derived(Math.min(100, Math.max(0, percent)));
  const isExceeded = $derived(current > target);
  const diff = $derived(roundToDecimals(Math.abs(target - current), decimals));

  const borderClasses: Record<string, string> = {
    amber: 'border-t-amber-500',
    blue: 'border-t-blue-500',
    emerald: 'border-t-emerald-500',
    rose: 'border-t-rose-500'
  };

  const badgeColor = $derived(
    isExceeded
      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
      : accentColor === 'amber'
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60'
        : accentColor === 'blue'
          ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60'
          : accentColor === 'emerald'
            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
            : 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
  );

  const barColor = $derived(
    isExceeded
      ? 'bg-rose-500'
      : accentColor === 'amber'
        ? 'bg-amber-500'
        : accentColor === 'blue'
          ? 'bg-blue-500'
          : accentColor === 'emerald'
            ? 'bg-emerald-500'
            : 'bg-rose-500'
  );
</script>

<Card class="border-t-4 {borderClasses[accentColor] || 'border-t-slate-500'}">
  <div class="flex items-center justify-between">
    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">
      {title}
    </span>
    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full {badgeColor}">
      {percent}%
    </span>
  </div>

  <div class="mt-3 flex items-baseline justify-between">
    <div>
      <span class="text-3xl font-black text-slate-900 dark:text-white">
        {roundToDecimals(current, decimals)}
      </span>
      <span class="text-xs text-slate-400">
        {#if unit === 'kcal'}
          / {roundToDecimals(target, decimals)} {unit}
        {:else}
          {unit} / {roundToDecimals(target, decimals)}{unit}
        {/if}
      </span>
    </div>
  </div>

  <!-- Progress Bar -->
  <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
    <div
      class="h-2.5 rounded-full transition-all duration-500 {barColor}"
      style="width: {barWidth}%"
    ></div>
  </div>

  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
    {#if isExceeded}
      {$t('dashboard.exceededBy', { amount: diff, unit })}
    {:else}
      {$t('dashboard.remainingForGoal', { amount: diff, unit })}
    {/if}
  </p>
</Card>
