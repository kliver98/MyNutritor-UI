<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/application/auth/auth.store';
  import { t } from '$lib/core/i18n/i18n.store';
  import Button from '$lib/ui/components/Button.svelte';
  import Input from '$lib/ui/components/Input.svelte';
  import Alert from '$lib/ui/components/Alert.svelte';
  import Card from '$lib/ui/components/Card.svelte';
  import { ENV } from '$lib/core/config/env';

  let username = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let validationError = $state<string | null>(null);

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault();
    validationError = null;

    if (!username.trim() || !password) {
      validationError = $t('auth.requiredField');
      return;
    }

    if (password !== confirmPassword) {
      validationError = $t('auth.passwordsMismatch');
      return;
    }

    try {
      const ok = await authStore.register({
        username: username.trim(),
        password
      });

      if (ok) {
        goto(`${base}/dashboard`);
      }
    } catch (err: unknown) {
      validationError = (err as Error)?.message || 'Error al registrar cuenta';
    }
  }

  function handleDemo(role: 'admin' | 'user') {
    authStore.setDemoSession(role);
    goto(`${base}/dashboard`);
  }
</script>

<div class="space-y-8 max-w-lg mx-auto">
  <div class="text-center space-y-2">
    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white">
      {$t('auth.registerTitle')}
    </h1>
    <p class="text-sm text-slate-500 dark:text-slate-400">
      {$t('auth.registerSubtitle')}
    </p>
  </div>

  <Card title={$t('auth.registerTitle')}>
    <form onsubmit={handleRegister} class="space-y-4">
      {#if validationError}
        <Alert variant="danger">{validationError}</Alert>
      {/if}

      {#if $authStore.error}
        <Alert variant="danger">{$authStore.error}</Alert>
      {/if}

      <Input
        label={$t('auth.username')}
        placeholder="ej. marcos_fit"
        bind:value={username}
        required
        disabled={$authStore.isLoading}
      />

      <Input
        label={$t('auth.password')}
        type="password"
        placeholder="••••••••"
        bind:value={password}
        required
        disabled={$authStore.isLoading}
      />

      <Input
        label={$t('auth.confirmPassword')}
        type="password"
        placeholder="••••••••"
        bind:value={confirmPassword}
        required
        disabled={$authStore.isLoading}
      />

      <Button type="submit" variant="primary" class="w-full mt-2" loading={$authStore.isLoading}>
        {$t('auth.submitRegister')}
      </Button>

      <div class="text-center pt-2">
        <a href="{base}/login" class="text-xs text-brand-600 dark:text-brand-400 hover:underline">
          {$t('auth.haveAccount')}
        </a>
      </div>
    </form>

    {#if ENV.ENABLE_DEMO_SHORTCUTS}
      <div class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p class="text-xs text-center font-medium text-slate-500 dark:text-slate-400 mb-3">
          {$t('auth.demoHint')}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onclick={() => handleDemo('user')}>
            👤 {$t('common.demoUser')}
          </Button>
          <Button variant="secondary" size="sm" onclick={() => handleDemo('admin')}>
            🛡️ {$t('common.demoAdmin')}
          </Button>
        </div>
      </div>
    {/if}
  </Card>
</div>
