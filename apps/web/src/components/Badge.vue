<!-- Badge (Premium): indicador de estado con variantes semánticas
  Variantes: default, success, warning, destructive, info, brand, outline, pill
  ("pill" es alias visual de default: solo silencia el validador, sin estilo propio)
  Tamaños: sm, md, lg
  Props: dot (indicador de punto), removable, clickable -->
<template>
  <span
    :class="[
      'badge-base',
      variantClass,
      sizeClass,
      { 'badge-dot': dot },
      { 'badge-removable': removable },
      { 'badge-clickable': clickable && !disabled },
      { 'badge-disabled': disabled },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-disabled="disabled"
    @click="onClick"
    @keydown.space.prevent="onKeyDown"
    @keydown.enter.prevent="onKeyDown"
  >
    <span class="badge-content flex items-center gap-1">
      <span v-if="dot" class="badge-dot-indicator" :style="dotStyle" />
      <slot />
    </span>
    <button
      v-if="removable && !disabled"
      type="button"
      class="badge-remove"
      @click.stop="onRemove"
      :aria-label="`Eliminar ${$slots.default?.[0]?.children || 'etiqueta'}`"
    >
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (v) => ["default", "success", "warning", "destructive", "info", "brand", "outline", "pill"].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["sm", "md", "lg"].includes(v),
  },
  dot: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  color: { type: String, default: "" }, // Custom hex color
});

const emit = defineEmits(["click", "remove"]);

const variantClass = computed(() => {
  if (props.color) return "";
  switch (props.variant) {
    case "success": return "badge-success";
    case "warning": return "badge-warning";
    case "destructive": return "badge-destructive";
    case "info": return "badge-info";
    case "brand": return "badge-brand";
    case "outline": return "badge-outline";
    default: return "badge-default";
  }
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm": return "badge-sm";
    case "lg": return "badge-lg";
    default: return "badge-md";
  }
});

const dotStyle = computed(() => {
  if (!props.color) return {};
  return { backgroundColor: props.color };
});

function onClick(e) {
  if (props.disabled || !props.clickable) return;
  emit("click", e);
}

function onKeyDown(e) {
  if (props.disabled || !props.clickable) return;
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    emit("click", e);
  }
}

function onRemove(e) {
  if (props.disabled) return;
  e.stopPropagation();
  emit("remove", e);
}
</script>

<style scoped>
.badge-base {
  @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors;
}

.badge-sm { @apply px-2 py-0.5 text-[10px] gap-1; }
.badge-md { @apply px-2.5 py-0.5 text-xs gap-1.5; }
.badge-lg { @apply px-3 py-1 text-sm gap-2; }

/* Variants */
.badge-default {
  @apply bg-[var(--bg-subtle)] border border-[var(--card-border)];
  color: #475569;
}
html.dark .badge-default {
  color: var(--fg-muted);
}
.badge-success {
  @apply bg-[var(--success-bg)] text-[var(--success-fg)];
  html.dark & { @apply bg-[var(--success-bg)] text-[var(--success-fg)]; }
}
.badge-warning {
  @apply bg-[var(--warning-bg)] text-[var(--warning-fg)];
  html.dark & { @apply bg-[var(--warning-bg)] text-[var(--warning-fg)]; }
}
.badge-destructive {
  @apply bg-[var(--destructive-bg)] text-[var(--destructive-fg)];
  html.dark & { @apply bg-[var(--destructive-bg)] text-[var(--destructive-fg)]; }
}
.badge-info {
  @apply bg-[var(--info-bg)] text-[var(--info-fg)];
  html.dark & { @apply bg-[var(--info-bg)] text-[var(--info-fg)]; }
}
.badge-brand {
  @apply bg-[var(--brand)] text-[var(--brand-fg)];
}
.badge-outline {
  @apply bg-transparent text-[var(--fg-muted)] border border-[var(--card-border)];
}

/* Dot indicator */
.badge-dot .badge-content {
  @apply gap-1.5;
}
.badge-dot-indicator {
  @apply h-1.5 w-1.5 rounded-full flex-shrink-0;
  background-color: currentColor;
}

/* Removable */
.badge-removable {
  @apply pr-1.5;
}
.badge-remove {
  @apply flex items-center justify-center w-5 h-5 rounded-full
       text-[var(--fg-muted)] hover:text-[var(--fg)]
       hover:bg-[var(--bg-subtle)] transition-colors duration-fast ease-out
       focus-ring focus-ring-offset-2;
  margin-left: 0.25rem;
}

/* Clickable */
.badge-clickable {
  @apply cursor-pointer hover-lift-sm press-scale-sm;
}
.badge-clickable:hover {
  filter: brightness(1.05);
}

/* Disabled */
.badge-disabled {
  @apply opacity-50 pointer-events-none cursor-not-allowed;
}

/* Custom color */
[style*="background-color"] {
  color: var(--brand-fg) !important;
}
</style>