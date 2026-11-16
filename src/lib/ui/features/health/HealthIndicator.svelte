<script lang="ts">
  import { onMount } from 'svelte';
  import { healthStore } from '../../../application/system/health.store';
  import { ENV } from '../../../core/config/env';
  import Badge from '../../components/Badge.svelte';
  import Button from '../../components/Button.svelte';
  import Card from '../../components/Card.svelte';
  import Alert from '../../components/Alert.svelte';

  onMount(() => {
    if (!$healthStore.lastChecked) {
      healthStore.checkHealth();
    }
  });

  const getStatusVariant = (status?: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (!status) return 'neutral';
    const s = status.toLowerCase();
    if (s === 'ok' || s === 'healthy') return 'success';
    if (s === 'degraded') return 'warning';
    return 'danger';
  };
</script>

<Card
  title="Estado del Backend (Google Cloud Run)"
  subtitle="Monitoreo de comunicación en tiempo real con la API REST"
>
  {#snippet headerAction()}
    <Button
      variant="outline"
      size="sm"
      loading={$healthStore.isLoading}
      onclick={() => healthStore.checkHealth()}
    >
      Verificar Estado
    </Button>
  {/snippet}

  <div class="space-y-4">
    <!-- Server Endpoint -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
    >
      <div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Endpoint Base</p>
        <code class="text-xs font-mono text-slate-800 dark:text-slate-200 break-all"
          >{ENV.API_BASE_URL}</code
        >
      </div>
      <div class="flex items-center gap-2">
        {#if $healthStore.health}
          <Badge variant={getStatusVariant($healthStore.health.status)} size="md">
            ● {$healthStore.health.status.toUpperCase()}
          </Badge>
        {:else if $healthStore.isLoading}
          <Badge variant="neutral" size="md">Conectando...</Badge>
        {:else}
          <Badge variant="danger" size="md">Sin Respuesta</Badge>
        {/if}
      </div>
    </div>

    <!-- Error message if any -->
    {#if $healthStore.error}
      <Alert variant="danger" title="Error de Comunicación">
        {$healthStore.error}
      </Alert>
    {/if}

    <!-- Health Details Grid -->
    {#if $healthStore.health}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div
          class="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">Servicio</p>
          <p class="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
            {$healthStore.rootInfo?.name || 'MyNutritor BE'}
          </p>
        </div>
        <div
          class="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">Versión</p>
          <p class="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {$healthStore.health.version || $healthStore.rootInfo?.version || '1.0.0'}
          </p>
        </div>
        <div
          class="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">Entorno</p>
          <p class="font-semibold text-sm text-slate-800 dark:text-slate-200 capitalize">
            {$healthStore.health.environment || 'Cloud Run'}
          </p>
        </div>
        <div
          class="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">Última Prueba</p>
          <p class="font-semibold text-xs text-slate-800 dark:text-slate-200">
            {$healthStore.lastChecked ? $healthStore.lastChecked.toLocaleTimeString() : 'N/A'}
          </p>
        </div>
      </div>
    {/if}
  </div>
</Card>
