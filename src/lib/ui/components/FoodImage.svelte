<script lang="ts">
  interface Props {
    src?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  }

  let { src = null, alt = 'Alimento', size = 'md', class: customClass = '' }: Props = $props();

  let imageError = $state(false);
  let isLoaded = $state(false);

  // Determina si el valor es una URL de imagen válida
  const isUrl = $derived(
    Boolean(
      src &&
      typeof src === 'string' &&
      (src.startsWith('http://') ||
        src.startsWith('https://') ||
        src.startsWith('data:image/') ||
        src.startsWith('/'))
    )
  );

  // Valor limpio y recortado
  const cleanedSrc = $derived(src?.trim() || '');

  // Resetear estados al cambiar la URL
  $effect(() => {
    // Escucha reactiva sobre cleanedSrc
    if (cleanedSrc) {
      imageError = false;
      isLoaded = false;
    }
  });

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs rounded-md',
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-10 h-10 text-lg rounded-xl',
    lg: 'w-14 h-14 text-2xl rounded-2xl',
    xl: 'w-20 h-20 text-4xl rounded-2xl'
  };

  const imageSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };
</script>

<div
  class="relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs select-none {sizeClasses[
    size
  ]} {customClass}"
  title={alt}
>
  {#if isUrl && !imageError}
    <!-- Imagen descargada en segundo plano con carga perezosa y fallback -->
    <img
      src={cleanedSrc}
      {alt}
      loading="lazy"
      decoding="async"
      onload={() => (isLoaded = true)}
      onerror={() => (imageError = true)}
      class="object-cover transition-opacity duration-200 {imageSizes[size]} {isLoaded
        ? 'opacity-100'
        : 'opacity-0'}"
    />
    {#if !isLoaded}
      <!-- Placeholder mientras se descarga en background -->
      <span class="absolute inset-0 flex items-center justify-center animate-pulse text-slate-400">
        🥦
      </span>
    {/if}
  {:else if cleanedSrc && !isUrl}
    <!-- Icono o emoji personalizado -->
    <span class="leading-none flex items-center justify-center" aria-hidden="true">
      {cleanedSrc}
    </span>
  {:else}
    <!-- Fallback por defecto: emoji de brócoli -->
    <span class="leading-none flex items-center justify-center" aria-hidden="true" title="Brócoli">
      🥦
    </span>
  {/if}
</div>
