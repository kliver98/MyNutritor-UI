<script lang="ts">
  import { t } from '$lib/core/i18n/i18n.store';
  import Card from '$lib/ui/components/Card.svelte';
</script>

<div class="space-y-8 max-w-4xl mx-auto">
  <!-- Header -->
  <div>
    <div
      class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-2"
    >
      <span>📖</span> Guía de Usuario & Documentación
    </div>
    <h1 class="text-3xl font-black text-slate-900 dark:text-white">{$t('help.title')}</h1>
    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
      {$t('help.subtitle')}
    </p>
  </div>

  <!-- Quick Flows (30-Second Guides) -->
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-slate-900 dark:text-white">{$t('help.quickStartTitle')}</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="border-t-4 border-t-brand-500">
        <div class="text-2xl mb-2">⚡</div>
        <h3 class="font-bold text-sm text-slate-900 dark:text-white">{$t('help.step1Title')}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {$t('help.step1Desc')}
        </p>
      </Card>

      <Card class="border-t-4 border-t-blue-500">
        <div class="text-2xl mb-2">📖</div>
        <h3 class="font-bold text-sm text-slate-900 dark:text-white">{$t('help.step2Title')}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {$t('help.step2Desc')}
        </p>
      </Card>

      <Card class="border-t-4 border-t-amber-500">
        <div class="text-2xl mb-2">🛡️</div>
        <h3 class="font-bold text-sm text-slate-900 dark:text-white">{$t('help.step3Title')}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {$t('help.step3Desc')}
        </p>
      </Card>
    </div>
  </section>

  <!-- Interactive Guide by Role -->
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-slate-900 dark:text-white">Guía de Funciones por Rol</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Card
        title="Modo Usuario Estándar"
        subtitle="Funcionalidades para seguimiento nutricional diario"
      >
        <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span
              ><strong>Dashboard de Macros:</strong> Monitorea en vivo tus calorías, proteína, carbohidratos
              y grasas diarias.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span
              ><strong>Catálogo de Alimentos:</strong> Filtra por categoría y marca alimentos excluidos
              de tu dieta con 1 clic.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span
              ><strong>Recetario Compartido:</strong> Crea recetas, define porciones y comparte permisos
              con otros usuarios.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span
              ><strong>Borradores e IA:</strong> Guarda ideas rápidas de comida y conviértelas en macros
              en un solo paso.</span
            >
          </li>
        </ul>
      </Card>

      <Card title="Modo Administrador" subtitle="Herramientas de supervisión y gestión del sistema">
        <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
          <li class="flex items-start gap-2">
            <span class="text-amber-500 font-bold">✓</span>
            <span
              ><strong>Gestión de Usuarios:</strong> Lista, inspección y administración de cuentas de
              usuario.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 font-bold">✓</span>
            <span
              ><strong>Matriz de Roles:</strong> Configuración y visualización de permisos y roles del
              sistema.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 font-bold">✓</span>
            <span
              ><strong>Preferencias Globales:</strong> Gestión de parámetros generales de la plataforma
              en tiempo real.</span
            >
          </li>
          <li class="flex items-start gap-2">
            <span class="text-amber-500 font-bold">✓</span>
            <span
              ><strong>Respaldos & Restauración:</strong> Exporta copias de respaldo de datos o ejecuta
              restauraciones con confirmación de seguridad.</span
            >
          </li>
        </ul>
      </Card>
    </div>
  </section>

  <!-- FAQs -->
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-slate-900 dark:text-white">{$t('help.faqTitle')}</h2>

    <div class="space-y-3">
      <Card title={$t('help.faq1Q')}>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {$t('help.faq1A')}
        </p>
      </Card>

      <Card title={$t('help.faq2Q')}>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {$t('help.faq2A')}
        </p>
      </Card>
    </div>
  </section>
</div>
