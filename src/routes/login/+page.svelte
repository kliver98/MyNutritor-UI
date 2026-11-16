<script lang="ts">
  import LoginForm from '$lib/ui/features/auth/LoginForm.svelte';
  import { t } from '$lib/core/i18n/i18n.store';
</script>

<div class="space-y-6 max-w-md mx-auto">
  <div class="text-center space-y-2">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{$t('auth.loginTitle')}</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400">
      {$t('auth.loginSubtitle')}
    </p>
  </div>

  <LoginForm />
</div>
