<!-- Badge (Fase 2): punto de estado o pastilla.
  variant="dot"  → punto + texto inline, hereda el color de texto (ex: etapa en Dashboard).
  variant="pill" → pastilla tintada (ex: "En vivo" en Correos).
  `color`: blue|green|red|purple|orange|zinc. `hex`: color arbitrario del backend (etapas). -->
<template>
  <span v-if="variant !== 'dot'" :class="boxedClasses">
    <span
      v-if="dot"
      class="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      :class="[dotClass, pulseClass]"
      :style="dotStyle"
    />
    <slot />
  </span>
  <span v-else class="inline-flex items-center gap-1.5">
    <span
      v-if="dot"
      class="inline-block flex-shrink-0 rounded-full"
      :class="[dotSize, dotClass, pulseClass]"
      :style="dotStyle"
    />
    <slot />
  </span>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  color: { type: String, default: "zinc" },
  hex: { type: String, default: "" },
  variant: { type: String, default: "dot" },
  pulse: { type: Boolean, default: false },
  dot: { type: Boolean, default: true },
  dotSize: { type: String, default: "h-2 w-2" },
});

const dots = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  zinc: "bg-zinc-400",
};

const pills = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  yellow:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300",
  zinc: "bg-zinc-200/70 text-zinc-600 dark:bg-white/10 dark:text-zinc-300",
};

const dotClass = computed(() =>
  props.hex ? "" : dots[props.color] || dots.zinc,
);
const dotStyle = computed(() =>
  props.hex ? { backgroundColor: props.hex } : undefined,
);
const boxedClasses = computed(() => [
  props.variant === "chip"
    ? "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs"
    : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  pills[props.color] || pills.zinc,
]);

const pulseClass = computed(() => {
  if (!props.pulse) return '';
  return 'animate-pulse-badge';
});

watch(() => props.pulse, (val) => {
  if (val) {
    setTimeout(() => {
      // Auto-reset pulse after animation
    }, 1000);
  }
});
</script>

<style scoped>
@keyframes pulse-badge {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
.animate-pulse-badge {
  animation: pulse-badge 0.8s ease-in-out;
}
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-badge {
    animation: none !important;
  }
}
</style>
