<!-- EmptyState: estado vacío con icono centrado, mensaje y CTA opcional (#action).
  Se usa dentro de TableState o como caja suelta en listas tarjetas. -->
<template>
  <div class="flex flex-col items-center gap-2 text-center">
    <span
      class="inline-flex items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-700/60 dark:text-zinc-500"
      :class="compact ? 'h-8 w-8' : 'h-11 w-11'"
    >
      <Icon :name="icon" :size="compact ? 16 : 20" />
    </span>
    <p class="text-sm text-zinc-500 dark:text-zinc-400">
      <slot />
    </p>
    <div v-if="$slots.action" class="mt-1.5">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import Icon from "./Icon.vue";

defineProps({
  icon: { type: String, default: "resumen" },
  compact: { type: Boolean, default: false },
});
</script>
