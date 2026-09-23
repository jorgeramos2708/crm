<!-- Card (Fase 2): superficie del sistema de diseño.
  flat     → .panel-flat, sin fondo ni sombra (resumen, dashboard).
  elevated → borde + sombra suave, sin fondo (formularios, bandejas).
  El padding y extras (p-6, overflow-hidden, mb-6) los pone el llamador. -->
<template>
  <section
    :class="
      variant === 'elevated'
        ? 'rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700'
        : 'panel-flat'
    "
  >
    <slot />
  </section>
</template>

<script setup>
defineProps({
  variant: { type: String, default: "flat" },
});
</script>
