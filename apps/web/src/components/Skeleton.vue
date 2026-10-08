<template>
  <div class="skeleton-container" :class="containerClasses">
    <template v-if="variant === 'card'">
      <div class="skeleton-card">
        <div v-for="i in rows" :key="i" class="skeleton-row">
          <div v-if="i === 1" class="skeleton-line skeleton-title" />
          <div v-else-if="i === 2" class="skeleton-line skeleton-subtitle" />
          <div v-else class="skeleton-line skeleton-text" />
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-row skeleton-header">
          <div v-for="i in cols" :key="i" class="skeleton-cell skeleton-header-cell" />
        </div>
        <div v-for="r in rows" :key="r" class="skeleton-row">
          <div v-for="c in cols" :key="c" class="skeleton-cell" />
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'list'">
      <div class="skeleton-list">
        <div v-for="i in rows" :key="i" class="skeleton-item">
          <div class="skeleton-avatar" />
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-title" />
            <div class="skeleton-line skeleton-text" />
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'chart'">
      <div class="skeleton-chart">
        <div class="skeleton-line skeleton-title" style="width: 40%;" />
        <div class="skeleton-chart-area skeleton-shimmer" />
      </div>
    </template>
    <template v-else>
      <!-- Default: simple lines -->
      <div class="skeleton-lines">
        <div v-for="i in rows" :key="i" class="skeleton-line" :style="{ width: lineWidth(i) }" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "lines",
    validator: (v) => ["lines", "card", "table", "list", "chart"].includes(v),
  },
  rows: { type: Number, default: 3 },
  cols: { type: Number, default: 4 },
  className: { type: String, default: "" },
  animated: { type: Boolean, default: true },
});

const containerClasses = computed(() => [
  "skeleton-container",
  { "skeleton-animated": props.animated },
  props.className,
]);

const lineWidth = (index) => {
  if (index === 1) return "60%";
  if (index === props.rows) return "40%";
  return "80%";
};
</script>

<style scoped>
.skeleton-container {
  @apply w-full;
}

.skeleton-animated .skeleton-line,
.skeleton-animated .skeleton-cell,
.skeleton-animated .skeleton-title,
.skeleton-animated .skeleton-text,
.skeleton-animated .skeleton-subtitle,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-chart-area {
  @apply skeleton-shimmer;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none !important;
  }
}

/* Lines */
.skeleton-lines {
  @apply space-y-3;
}

.skeleton-line {
  @apply h-4 rounded-lg bg-[var(--bg-hover)];
  animation: shimmer 1.5s infinite;
}

.skeleton-line.skeleton-title {
  @apply h-6 w-3/4;
}
.skeleton-line.skeleton-subtitle {
  @apply h-4 w-1/2;
}
.skeleton-line.skeleton-text {
  @apply h-4;
}

/* Card */
.skeleton-card {
  @apply p-6 space-y-3;
}

.skeleton-row {
  @apply flex items-center gap-3;
}

.skeleton-avatar {
  @apply w-10 h-10 rounded-full bg-[var(--bg-hover)] flex-shrink-0;
}

.skeleton-content {
  @apply flex-1 space-y-2 min-w-0;
}

/* Table */
.skeleton-table {
  @apply w-full space-y-2;
}

.skeleton-table .skeleton-row {
  @apply flex gap-4;
}

.skeleton-cell {
  @apply h-10 rounded-lg bg-[var(--bg-hover)] flex-1;
}

.skeleton-header .skeleton-cell {
  @apply h-8 font-semibold;
}

/* List */
.skeleton-list {
  @apply space-y-3;
}

.skeleton-item {
  @apply flex items-center gap-3 p-3 rounded-xl bg-[var(--panel)] border;
  border-color: var(--panel-border);
}

.skeleton-item .skeleton-avatar {
  @apply w-12 h-12;
}

.skeleton-item .skeleton-content {
  @apply space-y-1.5;
}

/* Chart */
.skeleton-chart {
  @apply p-6 space-y-4;
}

.skeleton-chart-area {
  @apply h-48 rounded-xl bg-[var(--bg-hover)];
}

/* Shimmer utility */
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-active) 50%, var(--bg-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

html.dark .skeleton-shimmer {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer { animation: none !important; }
}
</style>