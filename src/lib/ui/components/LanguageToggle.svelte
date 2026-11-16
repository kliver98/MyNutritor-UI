<script lang="ts">
  import { localeStore, toggleLocale } from '../../core/i18n/i18n.store';

  interface Props {
    class?: string;
  }

  let { class: customClass = '' }: Props = $props();
</script>

<button
  type="button"
  aria-label="Cambiar idioma entre Español e Inglés / Switch language"
  onclick={() => toggleLocale()}
  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none {customClass}"
  title="Cambiar idioma (ES/EN)"
>
  <span class="text-sm" aria-hidden="true">🌐</span>
  <span class="uppercase tracking-wider">{$localeStore}</span>
</button>
