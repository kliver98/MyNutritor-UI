<script lang="ts">
  interface Props {
    height?: string;
    width?: string;
    shape?: 'rectangle' | 'circle' | 'text';
    class?: string;
  }

  let {
    height = 'h-4',
    width = 'w-full',
    shape = 'rectangle',
    class: customClass = ''
  }: Props = $props();

  const shapeStyles = {
    rectangle: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded-sm'
  };
</script>

<div
  role="status"
  aria-busy="true"
  aria-hidden="true"
  class="animate-pulse bg-slate-200 dark:bg-slate-800 {height} {width} {shapeStyles[
    shape
  ]} {customClass}"
>
  <span class="sr-only">Cargando contenido...</span>
</div>
