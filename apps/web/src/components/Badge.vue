<!-- Badge (Fase 2): punto de estado o pastilla.
  variant="dot"  → punto + texto inline, hereda el color de texto (ex: etapa en Dashboard).
  variant="pill" → pastilla tintada (ex: "En vivo" en Correos).
  `color`: blue|green|red|purple|orange|zinc. `hex`: color arbitrario del backend (etapas). -->
<template>
  <span v-if="variant === 'pill'" :class="pillClasses">
    <span
      class="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      :class="[dotClass, pulse ? 'animate-pulse' : '']"
      :style="dotStyle"
    />
    <slot />
  </span>
  <span v-else class="inline-flex items-center gap-1.5">
    <span
      class="inline-block flex-shrink-0 rounded-full"
      :class="[dotSize, dotClass, pulse ? 'animate-pulse' : '']"
      :style="dotStyle"
    />
    <slot />
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  color: { type: String, default: "zinc" },
  hex: { type: String, default: "" },
  variant: { type: String, default: "dot" },
  pulse: { type: Boolean, default: false },
  dotSize: { type: String, default: "h-2 w-2" },
});

const dots = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
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
  zinc: "bg-zinc-200/70 text-zinc-600 dark:bg-white/10 dark:text-zinc-300",
};

const dotClass = computed(() =>
  props.hex ? "" : dots[props.color] || dots.zinc,
);
const dotStyle = computed(() =>
  props.hex ? { backgroundColor: props.hex } : undefined,
);
const pillClasses = computed(() => [
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  pills[props.color] || pills.zinc,
]);
</script>
