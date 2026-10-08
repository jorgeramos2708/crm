<template>
  <div
    class="stat-card"
    :class="{ 'stat-hover': !loading, 'stat-loading': loading }"
    :style="{ transform: hover ? 'translateY(-2px)' : '' }"
  >
    <div class="stat-header">
      <span
        class="stat-icon"
        :class="chip"
        :style="{ '--icon-color': iconColor }"
      >
        <Icon :path="icon" class="h-4 w-4" :stroke-width="2.2" />
      </span>
      <span
        class="stat-label text-[11px] font-semibold uppercase tracking-widest"
        :style="{ color: 'var(--fg-muted)' }"
      >{{ title }}</span>
    </div>
    <div
      class="stat-value-container"
      :style="{ transition: 'transform 0.2s ease' }"
    >
      <span
        v-if="loading"
        class="stat-skeleton skeleton-shimmer"
        :style="{ width: skeletonWidth }"
      />
      <span
        v-else
        class="stat-value"
        :style="{ transform: `scale(${scale})`, color: valueColor }"
      >{{ displayValue }}</span>
    </div>
    <div v-if="trend !== undefined && !loading" class="stat-trend" :class="trendClass">
      <Icon :path="trendIcon" class="h-3.5 w-3.5" :stroke-width="2.5" />
      <span class="text-[11px] font-semibold">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import Icon from "./Icon.vue";

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: "—" },
  icon: { type: String, default: "M4 6h16M4 12h16M4 18h16" },
  color: { type: String, default: "brand" }, // brand, success, warning, destructive, info, custom
  iconColor: { type: String, default: "" }, // Custom hex for icon background
  valueColor: { type: String, default: "" }, // Custom hex for value text
  animate: { type: Boolean, default: true },
  duration: { type: Number, default: 800 },
  trend: { type: Number, default: undefined }, // Percentage change
  trendLabel: { type: String, default: "" },
});

const chips = {
  brand: "stat-chip-brand",
  success: "stat-chip-success",
  warning: "stat-chip-warning",
  destructive: "stat-chip-destructive",
  info: "stat-chip-info",
};

const chip = chips[props.color] || chips.brand;

const displayValue = ref("");
const scale = ref(1);
const loading = ref(true);
const hover = ref(false);
let animationFrame = null;
let startTime = null;

const trendIcon = computed(() => {
  if (props.trend === undefined) return "";
  return props.trend >= 0
    ? "M5 10l7-7m0 0l7 7m-7-7v18" // up
    : "M19 14l-7 7m0 0l-7-7m7 7V4"; // down
});

const trendClass = computed(() => {
  if (props.trend === undefined) return "";
  return props.trend >= 0 ? "stat-trend-positive" : "stat-trend-negative";
});

const skeletonWidth = computed(() => {
  const target =
    typeof props.value === "number"
      ? props.value
      : parseFloat(String(props.value).replace(/[^0-9.-]/g, "")) || 0;
  const digits = String(Math.abs(target)).replace(/\D/g, "").length;
  return `${Math.max(digits * 0.6 + 2, 4)}ch`;
});

const animateCount = () => {
  const target =
    typeof props.value === "number"
      ? props.value
      : parseFloat(String(props.value).replace(/[^0-9.-]/g, "")) || 0;
  const isCurrency =
    String(props.value).includes("$") ||
    String(props.value).includes("€") ||
    String(props.value).includes("£") ||
    String(props.value).includes("S/");
  const prefix = isCurrency ? "S/ " : "";
  const decimals = target % 1 !== 0 ? 2 : 0;

  const animate = (currentTime) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / props.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = target * eased;
    displayValue.value =
      prefix +
      current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      displayValue.value =
        prefix +
        target.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      loading.value = false;
    }
  };

  if (props.animate && target > 0) {
    loading.value = true;
    startTime = null;
    animationFrame = requestAnimationFrame(animate);
  } else {
    displayValue.value = String(props.value);
    loading.value = false;
  }
};

const cleanup = () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
};

onMounted(() => {
  watch(
    () => props.value,
    () => {
      cleanup();
      animateCount();
    },
    { immediate: true },
  );
});

onBeforeUnmount(cleanup);
</script>

<style scoped>
.stat-card {
  @apply p-4 rounded-2xl bg-[var(--card)] border transition-all duration-200 ease-out;
  border-color: var(--card-border);
}

.stat-card:hover:not(.stat-loading) {
  @apply hover-lift-sm;
}

.stat-header {
  @apply flex items-center gap-2 mb-2;
}

.stat-icon {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0;
}

/* Chip variants - using CSS variables directly for dark mode opacity */
.stat-chip-brand {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0 text-[var(--brand)];
  background-color: var(--brand-light);
}
html.dark .stat-chip-brand {
  background-color: color-mix(in srgb, var(--brand) 20%, transparent);
  color: var(--brand);
}

.stat-chip-success {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0 text-[var(--success)];
  background-color: var(--success-bg);
}
html.dark .stat-chip-success {
  background-color: color-mix(in srgb, var(--success) 20%, transparent);
  color: var(--success);
}

.stat-chip-warning {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0 text-[var(--warning)];
  background-color: var(--warning-bg);
}
html.dark .stat-chip-warning {
  background-color: color-mix(in srgb, var(--warning) 20%, transparent);
  color: var(--warning);
}

.stat-chip-destructive {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0 text-[var(--destructive)];
  background-color: var(--destructive-bg);
}
html.dark .stat-chip-destructive {
  background-color: color-mix(in srgb, var(--destructive) 20%, transparent);
  color: var(--destructive);
}

.stat-chip-info {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0 text-[var(--info)];
  background-color: var(--info-bg);
}
html.dark .stat-chip-info {
  background-color: color-mix(in srgb, var(--info) 20%, transparent);
  color: var(--info);
}

.stat-label {
  @apply flex-1 truncate;
}

.stat-value-container {
  @apply relative;
}

.stat-value {
  @apply block text-3xl font-bold tabular-nums leading-tight;
  color: var(--fg);
  display: inline-block;
  transition: transform 0.2s ease;
}

.stat-skeleton {
  @apply h-8 rounded-lg;
}

.stat-trend {
  @apply mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5;
}

.stat-trend-positive {
  background-color: var(--success-bg);
  color: var(--success-fg);
}
.stat-trend-negative {
  background-color: var(--destructive-bg);
  color: var(--destructive-fg);
}

@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .stat-value {
    transition: none !important;
  }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse-subtle 1.5s ease-in-out infinite;
}
</style>