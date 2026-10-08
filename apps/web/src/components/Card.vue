<!-- Card (Premium): superficie del sistema de diseño con elevación y micro-interacciones
  Variantes:
    flat      → panel sutil, sin sombra (resumen, dashboard)
    elevated  → borde + sombra suave, elevación hover (formularios, bandejas)
    interactive → elevated + hover lift + focus ring (clickable cards)
    gradient  → borde gradient brand (featured)
    glass     → glassmorphism con blur (premium)
  Props: variant, padding, hover, clickable, bordered -->
<template>
  <section
    :class="[
      baseClasses,
      variantClasses,
      paddingClasses,
      { 'card-hoverable': hover && !clickable && !disabled },
      { 'card-clickable': clickable && !disabled },
      { 'card-focused': focused },
      { 'card-disabled': disabled },
      { 'card-bordered': bordered },
    ]"
    :tabindex="clickable ? 0 : undefined"
    :role="clickable ? 'button' : undefined"
    :aria-pressed="clickable ? pressed : undefined"
    :aria-disabled="disabled"
    @click="onClick"
    @keydown.space.prevent="onKeyDown"
    @keydown.enter.prevent="onKeyDown"
    @focus="focused = true"
    @blur="focused = false"
    @mousedown="pressed = true"
    @mouseup="pressed = false"
    @mouseleave="pressed = false"
  >
    <slot name="header">
      <header v-if="$slots.header" class="card-header">
        <slot name="header" />
      </header>
    </slot>

    <slot name="default" />

    <slot name="footer">
      <footer v-if="$slots.footer" class="card-footer">
        <slot name="footer" />
      </footer>
    </slot>

    <!-- Shimmer border for gradient variant -->
    <div v-if="variant === 'gradient'" class="card-gradient-border" aria-hidden="true" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "flat",
    validator: (v) => ["flat", "elevated", "interactive", "gradient", "glass"].includes(v),
  },
  padding: {
    type: String,
    default: "default",
    validator: (v) => ["none", "sm", "default", "lg", "xl"].includes(v),
  },
  hover: { type: Boolean, default: true },
  clickable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  bordered: { type: Boolean, default: true },
  pressed: { type: Boolean, default: false },
});

const emit = defineEmits(["click", "focus", "blur"]);

const focused = ref(false);
const pressed = ref(false);

const baseClasses = computed(() => [
  "rounded-2xl",
  "transition-all duration-200 ease-out",
  "focus-ring",
  "focus-ring-offset-2",
]);

const variantClasses = computed(() => {
  switch (props.variant) {
    case "flat":
      return ["bg-[var(--panel)]", "border", "border-[var(--panel-border)]"];
    case "elevated":
      return [
        "bg-[var(--card)]",
        "border",
        "border-[var(--card-border)]",
        "shadow-sm",
      ];
    case "interactive":
      return [
        "bg-[var(--card)]",
        "border",
        "border-[var(--card-border)]",
        "shadow-sm",
        "cursor-pointer",
        "hover-lift",
        "press-scale",
      ];
    case "gradient":
      return [
        "bg-[var(--card)]",
        "relative",
        "overflow-hidden",
        "shadow-sm",
      ];
    case "glass":
      return [
        "glass-panel",
      ];
    default:
      return ["bg-[var(--panel)]", "border", "border-[var(--panel-border)]"];
  }
});

const paddingClasses = computed(() => {
  switch (props.padding) {
    case "none": return [];
    case "sm": return ["p-4"];
    case "default": return ["p-6"];
    case "lg": return ["p-8"];
    case "xl": return ["p-10"];
    default: return ["p-6"];
  }
});

function onClick(e) {
  if (props.disabled || props.clickable === false) return;
  emit("click", e);
}

function onKeyDown(e) {
  if (props.disabled || props.clickable === false) return;
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    pressed.value = true;
    setTimeout(() => { pressed.value = false; }, 100);
    emit("click", e);
  }
}
</script>

<style scoped>
.card-header {
  @apply px-6 py-4 border-b;
  border-color: var(--card-border);
}
.card-body {
  @apply p-6;
}
.card-footer {
  @apply px-6 py-4 border-t;
  border-color: var(--card-border);
}

/* Gradient border effect */
.card-gradient-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.card:hover .card-gradient-border {
  opacity: 1;
}

/* Hover lift effect - handled by .hover-lift utility */
/* Press scale - handled by .press-scale utility */

.card-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.card-bordered {
  border-width: 1px;
}

/* Focus ring enhancement */
.card-focused {
  box-shadow: 0 0 0 2px var(--brand), var(--shadow-sm);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .card,
  .card * {
    transition: none !important;
    animation: none !important;
  }
}

/* Stagger entrance animation for card grids */
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-card-enter {
  animation: card-enter var(--duration-normal) var(--ease-spring) both;
}
</style>