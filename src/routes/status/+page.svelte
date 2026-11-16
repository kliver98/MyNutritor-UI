<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { healthStore } from '$lib/application/system/health.store';
  import { isAdmin } from '$lib/application/auth/auth.store';
  import { ENV } from '$lib/core/config/env';
  import { t } from '$lib/core/i18n/i18n.store';
  import Badge from '$lib/ui/components/Badge.svelte';
  import Button from '$lib/ui/components/Button.svelte';
  import Card from '$lib/ui/components/Card.svelte';
  import Alert from '$lib/ui/components/Alert.svelte';

  let isBrowserOnline = $state(true);

  onMount(() => {
    if (!$isAdmin) {
      goto(`${base}/dashboard`);
      return;
    }

    if (typeof navigator !== 'undefined') {
      isBrowserOnline = navigator.onLine;
      const setOnline = () => (isBrowserOnline = true);
      const setOffline = () => (isBrowserOnline = false);
      window.addEventListener('online', setOnline);
      window.addEventListener('offline', setOffline);

      return () => {
        window.removeEventListener('online', setOnline);
        window.removeEventListener('offline', setOffline);
      };
    }

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

  const getDbLatency = (): number | null => {
    const details = $healthStore.health?.details as
      { database?: { latencyMs?: number } } | undefined;
    return details?.database?.latencyMs ?? null;
  };

  const isDbConnected = (): boolean | null => {
    const details = $healthStore.health?.details as
      { database?: { connected?: boolean } } | undefined;
    return details?.database?.connected ?? null;
  };
</script>

<svelte:head>
  <title>{$t('systemStatus.title')} | MyNutritor</title>
</svelte:head>

{#if $isAdmin}
  <div class="space-y-8 max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-2"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {$t('systemStatus.title')}
        </div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white">
          {$t('systemStatus.title')}
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {$t('systemStatus.subtitle')}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          loading={$healthStore.isLoading}
          onclick={() => healthStore.checkHealth()}
        >
          🔄 {$t('systemStatus.checkStatus')}
        </Button>
      </div>
    </div>

    <!-- Primary Backend Communication Card -->
    <Card title={$t('systemStatus.backendStatus')} subtitle={$t('systemStatus.subtitle')}>
      {#snippet headerAction()}
        <div class="flex items-center gap-2">
          {#if $healthStore.health}
            <Badge variant={getStatusVariant($healthStore.health.status)} size="md">
              ● {$healthStore.health.status.toUpperCase()}
            </Badge>
          {:else if $healthStore.isLoading}
            <Badge variant="neutral" size="md">{$t('systemStatus.connecting')}</Badge>
          {:else}
            <Badge variant="danger" size="md">{$t('systemStatus.noResponse')}</Badge>
          {/if}
        </div>
      {/snippet}

      <div class="space-y-4">
        <!-- Endpoint Base -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
        >
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {$t('systemStatus.endpointBase')}
            </p>
            <code class="text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all">
              {ENV.API_BASE_URL}
            </code>
          </div>
          <div class="flex items-center gap-2">
            <a
              href="{ENV.API_BASE_URL}/api/v1/health"
              target="_blank"
              rel="noreferrer"
              class="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              GET /api/v1/health ↗
            </a>
          </div>
        </div>

        <!-- Error alert if any -->
        {#if $healthStore.error}
          <Alert variant="danger" title={$t('common.error')}>
            {$healthStore.error}
          </Alert>
        {/if}

        <!-- Detailed Real-time Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {$t('systemStatus.service')}
            </p>
            <p class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {$healthStore.rootInfo?.name || 'MyNutritor-Backend'}
            </p>
          </div>

          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {$t('systemStatus.version')}
            </p>
            <p class="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
              {$healthStore.health?.version || '1.0.0'}
            </p>
          </div>

          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {$t('systemStatus.environment')}
            </p>
            <p class="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize mt-0.5">
              {$healthStore.health?.environment || 'Cloud Run (prod)'}
            </p>
          </div>

          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {$t('systemStatus.lastCheck')}
            </p>
            <p class="font-bold text-xs text-slate-900 dark:text-slate-100 mt-0.5">
              {$healthStore.lastChecked ? $healthStore.lastChecked.toLocaleTimeString() : 'N/A'}
            </p>
          </div>
        </div>

        <!-- Database & Diagnostics Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <!-- Firestore Database Connection -->
          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">🔥</span>
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {$t('systemStatus.database')}
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Google Cloud Firestore (NoSQL)
                </p>
              </div>
            </div>
            <div class="text-right">
              {#if isDbConnected() === true}
                <Badge variant="success" size="sm">{$t('systemStatus.connected')}</Badge>
              {:else if isDbConnected() === false}
                <Badge variant="danger" size="sm">{$t('systemStatus.disconnected')}</Badge>
              {:else}
                <Badge variant="neutral" size="sm">Operativa</Badge>
              {/if}
              {#if getDbLatency() !== null}
                <p class="text-[10px] text-slate-400 mt-1 font-mono">
                  {getDbLatency()} ms {$t('systemStatus.latency')}
                </p>
              {/if}
            </div>
          </div>

          <!-- Local Browser Connection -->
          <div
            class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">🌐</span>
              <div>
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {$t('systemStatus.networkStatus')}
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Conectividad del dispositivo cliente
                </p>
              </div>
            </div>
            <div>
              {#if isBrowserOnline}
                <Badge variant="success" size="sm">{$t('systemStatus.online')}</Badge>
              {:else}
                <Badge variant="danger" size="sm">{$t('systemStatus.offline')}</Badge>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
{:else}
  <div class="max-w-md mx-auto py-16 text-center space-y-4">
    <div class="text-4xl">🛡️</div>
    <h2 class="text-xl font-bold text-slate-900 dark:text-white">Acceso Restringido</h2>
    <p class="text-sm text-slate-500">
      El monitor de estado del servidor está reservado exclusivamente para administradores.
    </p>
    <a href="{base}/dashboard" class="inline-block mt-4">
      <Button variant="primary">Volver al Dashboard</Button>
    </a>
  </div>
{/if}
