<script lang="ts">
  import { base } from '$app/paths';
  import Button from '$lib/ui/components/Button.svelte';
  import Card from '$lib/ui/components/Card.svelte';
  import { isAuthenticated, isAdmin } from '$lib/application/auth/auth.store';
  import { t } from '$lib/core/i18n/i18n.store';
</script>

<div class="space-y-12">
  <!-- Hero Section -->
  <section class="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-10">
    <div
      class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
    >
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      🥗 Nutrición Inteligente y Hábitos Saludables
    </div>

    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
      Gestión Nutricional <span class="text-brand-600 dark:text-brand-400"
        >Fácil, Rápida y Precisa</span
      >
    </h1>

    <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300">
      Monitorea tus calorías y macronutrientes, descubre y crea recetas saludables y alcanza tus
      objetivos diarios de forma sencilla.
    </p>

    <div class="flex items-center justify-center gap-3 pt-2">
      {#if $isAuthenticated}
        <a href="{base}/dashboard">
          <Button variant="primary" size="lg">Ir a mi Dashboard →</Button>
        </a>
      {:else}
        <a href="{base}/login">
          <Button variant="primary" size="lg">{$t('nav.login')}</Button>
        </a>
        <a href="{base}/register">
          <Button variant="outline" size="lg">{$t('nav.register')}</Button>
        </a>
      {/if}
      {#if $isAdmin}
        <a href="{base}/status">
          <Button variant="ghost" size="lg">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            {$t('nav.status')}
          </Button>
        </a>
      {/if}
    </div>
  </section>

  <!-- Product Feature Highlights -->
  <section class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
    <Card title="🥗 Control de Macronutrientes" subtitle="Seguimiento en tiempo real">
      <p class="text-xs text-slate-600 dark:text-slate-400">
        Monitorea tus calorías, proteínas, carbohidratos y grasas día a día con metas nutricionales
        adaptadas a tu estilo de vida.
      </p>
    </Card>

    <Card title="🥑 Alimentos y Porciones" subtitle="Catálogo flexible">
      <p class="text-xs text-slate-600 dark:text-slate-400">
        Consulta el valor nutricional de tus comidas, añade alimentos personalizados y gestiona tus
        preferencias y exclusiones.
      </p>
    </Card>

    <Card title="📈 Gráficos y Progreso" subtitle="Estadísticas de adherencia">
      <p class="text-xs text-slate-600 dark:text-slate-400">
        Visualiza tus tendencias semanales y mensuales con gráficos claros para evaluar tu balance y
        mejorar tus hábitos.
      </p>
    </Card>
  </section>
</div>
