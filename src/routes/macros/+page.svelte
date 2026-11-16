<script lang="ts">
  import { base } from '$app/paths';
  import Card from '$lib/ui/components/Card.svelte';
  import Button from '$lib/ui/components/Button.svelte';
</script>

<div class="space-y-6 max-w-5xl mx-auto">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Macros Diarios</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Registro y seguimiento de consumo nutricional diario.
      </p>
    </div>
    <a href="{base}/dashboard">
      <Button variant="primary" size="sm">Ir al Dashboard Nutricional &rarr;</Button>
    </a>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card title="Gestión en Tiempo Real" subtitle="Control de metas y balances">
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Accede al panel principal para visualizar tus calorías, proteínas, carbohidratos y grasas
        con cálculo automático de adherencia y selector dinámico de fechas.
      </p>
      <a
        href="{base}/dashboard"
        class="text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline"
      >
        Abrir Panel de Control &rarr;
      </a>
    </Card>

    <Card title="Reportes y Tendencias" subtitle="Historial y gráficos">
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Analiza la evolución de tus macros mediante gráficos de dispersión, promedio y cumplimiento
        de objetivos.
      </p>
      <a
        href="{base}/reports"
        class="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline"
      >
        Ver Reportes Nutricionales &rarr;
      </a>
    </Card>
  </div>
</div>
