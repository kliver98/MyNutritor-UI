<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { authStore } from '../../../application/auth/auth.store';
  import { t } from '../../../core/i18n/i18n.store';
  import Button from '../../components/Button.svelte';
  import Input from '../../components/Input.svelte';
  import Alert from '../../components/Alert.svelte';
  import Card from '../../components/Card.svelte';
  import { ENV } from '../../../core/config/env';

  let usernameOrEmail = $state('');
  let password = $state('');
  let validationError = $state<string | null>(null);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    validationError = null;

    // Resilient fallback in case browser autofills values without triggering Svelte input events
    const form = e.currentTarget as HTMLFormElement;
    const userInput = form.elements.namedItem('username') as HTMLInputElement | null;
    const passInput = form.elements.namedItem('password') as HTMLInputElement | null;

    const resolvedUser = (userInput?.value || usernameOrEmail).trim();
    const resolvedPass = passInput?.value || password;

    if (!resolvedUser) {
      validationError = $t('auth.requiredField');
      return;
    }
    if (!resolvedPass) {
      validationError = $t('auth.requiredField');
      return;
    }

    const ok = await authStore.login({
      usernameOrEmail: resolvedUser,
      password: resolvedPass
    });

    if (ok) {
      goto(`${base}/dashboard`);
    }
  }

  function handleDemoLogin(role: 'admin' | 'user') {
    authStore.setDemoSession(role);
    goto(`${base}/dashboard`);
  }
</script>

<div class="w-full max-w-md mx-auto">
  <Card title={$t('auth.loginTitle')} subtitle={$t('auth.loginSubtitle')}>
    <form onsubmit={handleSubmit} class="space-y-4">
      {#if validationError}
        <Alert variant="danger">{validationError}</Alert>
      {/if}

      {#if $authStore.error}
        <Alert variant="danger">{$authStore.error}</Alert>
      {/if}

      <Input
        name="username"
        label={$t('auth.usernameOrEmail')}
        placeholder="ej. usuario o correo@ejemplo.com"
        bind:value={usernameOrEmail}
        autocomplete="username"
        required
        disabled={$authStore.isLoading}
      />

      <Input
        name="password"
        label={$t('auth.password')}
        type="password"
        placeholder="••••••••"
        bind:value={password}
        autocomplete="current-password"
        required
        disabled={$authStore.isLoading}
      />

      <Button type="submit" variant="primary" class="w-full mt-2" loading={$authStore.isLoading}>
        {$t('auth.submitLogin')}
      </Button>
    </form>

    {#if ENV.ENABLE_DEMO_SHORTCUTS}
      <div class="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p class="text-xs text-center font-medium text-slate-500 dark:text-slate-400 mb-3">
          {$t('auth.demoHint')}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onclick={() => handleDemoLogin('user')}>
            👤 {$t('common.demoUser')}
          </Button>
          <Button variant="secondary" size="sm" onclick={() => handleDemoLogin('admin')}>
            🛡️ {$t('common.demoAdmin')}
          </Button>
        </div>
      </div>
    {/if}
  </Card>
</div>
