<!-- Avatar (Premium): avatar de usuario con fallbacks, badges de estado, grupos
  Props: src, alt, name, size, status, shape, clickable
  Tamaños: xs, sm, md, lg, xl, 2xl
  Estados: online, away, busy, offline
  Formas: circle, square -->
<template>
  <div
    :class="[
      'avatar-wrapper',
      sizeClass,
      { 'avatar-clickable': clickable },
      { 'avatar-shape-square': shape === 'square' },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="onClick"
    @keydown.space.prevent="onKeyDown"
    @keydown.enter.prevent="onKeyDown"
  >
    <!-- Image or fallback -->
    <div
      v-if="!hasImage"
      class="avatar-fallback"
      :class="sizeClass"
      :style="fallbackStyle"
    >
      <span v-if="initials" class="avatar-initials">{{ initials }}</span>
      <component v-else :is="defaultIcon" class="avatar-default-icon" />
    </div>
    <img
      v-else
      :src="src"
      :alt="alt || name || 'Avatar'"
      class="avatar-image"
      :class="sizeClass"
      @error="onImageError"
      loading="lazy"
    />

    <!-- Status indicator -->
    <span
      v-if="status && status !== 'offline'"
      class="avatar-status"
      :class="[
        statusClass,
        sizeClass,
        { 'avatar-status-bottom-right': statusPosition === 'bottom-right' },
        { 'avatar-status-top-right': statusPosition === 'top-right' },
      ]"
      :title="statusLabel"
      :aria-label="statusLabel"
    />

    <!-- Notification badge -->
    <span
      v-if="badge"
      class="avatar-badge"
      :class="sizeClass"
    >
      {{ badge }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { User, Building2 } from "@lucide/vue";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
  name: { type: String, default: "" },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["xs", "sm", "md", "lg", "xl", "2xl"].includes(v),
  },
  status: {
    type: String,
    default: "offline",
    validator: (v) => ["online", "away", "busy", "offline"].includes(v),
  },
  shape: {
    type: String,
    default: "circle",
    validator: (v) => ["circle", "square"].includes(v),
  },
  statusPosition: {
    type: String,
    default: "bottom-right",
    validator: (v) => ["bottom-right", "top-right"].includes(v),
  },
  badge: { type: String, default: "" },
  clickable: { type: Boolean, default: false },
  defaultIcon: { type: Object, default: () => User },
  fallbackColor: { type: String, default: "" }, // Custom hex for fallback
});

const emit = defineEmits(["click"]);

const hasImage = ref(false);
const imageError = ref(false);

const initials = computed(() => {
  if (!props.name) return "";
  const parts = props.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "xs": return "avatar-xs";
    case "sm": return "avatar-sm";
    case "lg": return "avatar-lg";
    case "xl": return "avatar-xl";
    case "2xl": return "avatar-2xl";
    default: return "avatar-md";
  }
});

const statusClass = computed(() => {
  switch (props.status) {
    case "online": return "avatar-status-online";
    case "away": return "avatar-status-away";
    case "busy": return "avatar-status-busy";
    default: return "";
  }
});

const fallbackStyle = computed(() => {
  if (!props.fallbackColor || hasImage.value) return {};
  return { backgroundColor: props.fallbackColor };
});

const statusLabel = computed(() => {
  const labels = {
    online: "En línea",
    away: "Ausente",
    busy: "Ocupado",
    offline: "Desconectado",
  };
  return labels[props.status] || "";
});

function onImageError() {
  imageError.value = true;
  hasImage.value = false;
}

function onClick(e) {
  if (props.clickable) {
    emit("click", e);
  }
}

function onKeyDown(e) {
  if (!props.clickable) return;
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    emit("click", e);
  }
}

// Watch for src changes
watch(
  () => props.src,
  (newSrc) => {
    hasImage.value = Boolean(newSrc && !imageError.value);
  },
  { immediate: true }
);
</script>

<style scoped>
/* Sizes */
.avatar-xs { width: 24px; height: 24px; }
.avatar-sm { width: 32px; height: 32px; }
.avatar-md { width: 40px; height: 40px; }
.avatar-lg { width: 48px; height: 48px; }
.avatar-xl { width: 64px; height: 64px; }
.avatar-2xl { width: 96px; height: 96px; }

.avatar-wrapper {
  @apply inline-flex items-center justify-center relative shrink-0 overflow-hidden;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
  font-family: var(--font-sans);
  font-weight: var(--font-semibold);
  color: var(--brand-fg);
  transition: transform var(--duration-fast) var(--ease-out);
}

.avatar-shape-square {
  border-radius: var(--radius-xl);
}

.avatar-image {
  @apply w-full h-full object-cover;
}

.avatar-fallback {
  @apply w-full h-full flex items-center justify-center;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
}

.avatar-initials {
  @apply font-semibold text-[var(--brand-fg)];
  font-size: 0.6em;
  line-height: 1;
}

.avatar-default-icon {
  @apply text-[var(--brand-fg)];
  font-size: 0.7em;
}

.avatar-clickable {
  @apply cursor-pointer hover-lift-sm press-scale-sm;
}

.avatar-clickable:hover {
  transform: scale(1.02);
}

/* Status indicator */
.avatar-status {
  @apply absolute flex-shrink-0 rounded-full border-2;
  border-color: var(--bg);
  width: 0.75rem;
  height: 0.75rem;
}

.avatar-xs .avatar-status,
.avatar-sm .avatar-status {
  width: 0.5rem;
  height: 0.5rem;
}

.avatar-lg .avatar-status,
.avatar-xl .avatar-status {
  width: 1rem;
  height: 1rem;
}

.avatar-2xl .avatar-status {
  width: 1.25rem;
  height: 1.25rem;
}

.avatar-status-online {
  background-color: var(--success);
}
.avatar-status-away {
  background-color: var(--warning);
}
.avatar-status-busy {
  background-color: var(--destructive);
}

.avatar-status-bottom-right {
  bottom: 0;
  right: 0;
}
.avatar-status-top-right {
  top: 0;
  right: 0;
}

/* Badge */
.avatar-badge {
  @apply absolute -top-1 -right-1 flex items-center justify-center
         h-5 rounded-full px-1.5 text-[10px] font-bold
         bg-[var(--destructive)] text-[var(--destructive-fg)];
  font-size: 0.65rem;
  line-height: 1;
  min-width: 1.25rem;
}

.avatar-xs .avatar-badge,
.avatar-sm .avatar-badge {
  @apply h-4 px-1 text-[9px];
  min-width: 1rem;
}
.avatar-lg .avatar-badge,
.avatar-xl .avatar-badge {
  @apply h-6 px-2 text-xs;
  min-width: 1.5rem;
}
.avatar-2xl .avatar-badge {
  @apply h-8 px-2.5 text-sm;
  min-width: 2rem;
}
</style>