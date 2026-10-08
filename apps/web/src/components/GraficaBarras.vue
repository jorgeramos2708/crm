<!-- GraficaBarras (Premium): barras SVG con animaciones fluidas, tooltip interactivo, grid adaptativo
  Props: datos [{etiqueta, valor, valorFmt?, extra?, corto?, color?}], color, animar, height, showGrid, showTooltip, showAnimation
  Accesibilidad: role="img", aria-label, focusable bars con keyboard navigation -->
<template>
  <div class="chart-container" role="figure" :aria-label="ariaLabel">
    <div
      v-if="!datos.length"
      class="chart-empty"
      role="status"
      aria-live="polite"
    >
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 3v18h18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7 16l4-4 4 4 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <p class="empty-text">{{ emptyMessage }}</p>
    </div>

    <svg
      v-else
      :viewBox="`0 0 ${width} ${height}`"
      class="chart-svg"
      role="img"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="onKeydown"
      @mousemove="onMousemove"
      @mouseleave="onMouseleave"
      @focus="focused = true"
      @blur="focused = false"
    >
      <!-- Defs for gradients and filters -->
      <defs>
        <!-- Bar gradient -->
        <linearGradient
          v-for="(bar, i) in bars"
          :key="`grad-${i}`"
          :id="`barGrad-${i}`"
          x1="0" y1="1" x2="0" y2="0"
        >
          <stop :offset="'0%'" :stop-color="bar.color" :stop-opacity="0.9" />
          <stop :offset="'100%'" :stop-color="bar.color" :stop-opacity="0.3" />
        </linearGradient>

        <!-- Highlight gradient -->
        <linearGradient
          v-for="(bar, i) in bars"
          :key="`hlGrad-${i}`"
          :id="`hlGrad-${i}`"
          x1="0" y1="0" x2="1" y2="0"
        >
          <stop :offset="'0%'" :stop-color="bar.color" :stop-opacity="1" />
          <stop :offset="'50%'" :stop-color="bar.color" :stop-opacity="0.6" />
          <stop :offset="'100%'" :stop-color="bar.color" :stop-opacity="1" />
        </linearGradient>

        <!-- Drop shadow filter -->
        <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.15" />
        </filter>

        <!-- Glow filter for highlighted bar -->
        <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Grid lines -->
      <g v-if="showGrid" class="grid-lines" aria-hidden="true">
        <line
          v-for="g in gridY"
          :key="g.y"
          :x1="paddingLeft"
          :x2="width - paddingRight"
          :y1="g.y"
          :y2="g.y"
          class="grid-line"
          stroke-width="1"
        />
        <line
          :x1="paddingLeft"
          :x2="width - paddingRight"
          :y1="chartBottom"
          :y2="chartBottom"
          class="axis-line"
          stroke-width="1.5"
        />
      </g>

      <!-- Y-axis labels -->
      <g v-if="showGrid" class="y-axis-labels" aria-hidden="true">
        <text
          v-for="g in gridY"
          :key="g.y"
          :x="paddingLeft - 12"
          :y="g.y + 4"
          class="axis-label"
          text-anchor="end"
          font-size="11"
        >
          {{ formatValue(g.value) }}
        </text>
      </g>

      <!-- Bars -->
      <g class="bars-group">
        <g
          v-for="(bar, i) in bars"
          :key="bar.etiqueta"
          class="bar-group"
          :class="{ 'bar-highlighted': highlightedIndex === i }"
          :transform="`translate(0, ${bar.y})`"
          :style="{ cursor: showTooltip ? 'pointer' : 'default' }"
          @mouseenter="onBarEnter(i, bar)"
          @mouseleave="onBarLeave"
          @click="onBarClick(i, bar)"
          @focus="focusedBarIndex = i"
          :tabindex="0"
          role="button"
          :aria-label="`${bar.etiqueta}: ${bar.valorFmt} (${bar.extra || ''})`"
          :aria-pressed="highlightedIndex === i"
        >
          <!-- Bar background (track) -->
          <rect
            :x="bar.x"
            :y="0"
            :width="bar.width"
            :height="bar.maxHeight"
            rx="6"
            class="bar-track"
            fill="var(--bg-subtle)"
          />

          <!-- Animated bar -->
          <rect
            :x="bar.x"
            :y="bar.height > 0 ? bar.displayHeight : 0"
            :width="bar.width"
            :height="bar.displayHeight"
            rx="6"
            :fill="`url(#barGrad-${bar.index})`"
            :filter="highlightedIndex === i ? 'url(#barGlow)' : 'url(#barShadow)'"
            class="bar-main"
          >
            <animate
              v-if="animar && !reducedMotion"
              attributeName="height"
              :from="0"
              :to="bar.displayHeight"
              :dur="`${duration}ms`"
              :begin="`${i * delay}ms`"
              fill="freeze"
              calcMode="spline"
              keySplines="0.34 1.56 0.64 1"
            />
            <animate
              v-if="animar && !reducedMotion"
              attributeName="y"
              :from="bar.maxHeight"
              :to="bar.displayHeight > 0 ? bar.displayHeight : bar.maxHeight"
              :dur="`${duration}ms`"
              :begin="`${i * delay}ms`"
              fill="freeze"
              calcMode="spline"
              keySplines="0.34 1.56 0.64 1"
            />
          </rect>

          <!-- Highlight overlay -->
          <rect
            v-if="highlightedIndex === i"
            :x="bar.x"
            :y="0"
            :width="bar.width"
            :height="bar.displayHeight > 0 ? bar.displayHeight : bar.maxHeight"
            rx="6"
            :fill="`url(#hlGrad-${bar.index})`"
            class="bar-highlight"
            opacity="0.3"
          />

          <!-- Value label on top of bar -->
          <text
            v-if="bar.displayHeight > 18 && bar.valor > 0"
            :x="bar.x + bar.width / 2"
            :y="bar.displayHeight - 8"
            text-anchor="middle"
            class="bar-value-label"
            font-size="11"
            font-weight="600"
            fill="white"
            opacity="0.95"
          >
            {{ bar.corto || bar.valorFmt }}
          </text>

          <!-- Bar label below axis -->
          <text
            :x="bar.x + bar.width / 2"
            :y="bar.maxHeight + 18"
            text-anchor="middle"
            class="bar-label"
            font-size="10"
            fill="var(--fg-muted)"
          >
            {{ bar.etiqueta }}
          </text>
        </g>
      </g>

      <!-- Tooltip -->
      <g v-if="showTooltip && hoveredBar !== null && hoveredBar.valor > 0" class="tooltip-group">
        <rect
          :x="tooltipX"
          :y="tooltipY - 36"
          width="140"
          height="52"
          rx="8"
          class="tooltip-bg"
          filter="url(#tooltipShadow)"
        />
        <text
          :x="tooltipX + 70"
          :y="tooltipY - 26"
          text-anchor="middle"
          class="tooltip-label"
          font-size="10"
          fill="var(--fg-muted)"
        >
          {{ hoveredBar.etiqueta }}
        </text>
        <text
          :x="tooltipX + 70"
          :y="tooltipY - 12"
          text-anchor="middle"
          class="tooltip-value"
          font-size="14"
          font-weight="700"
          :fill="hoveredBar.color"
        >
          {{ hoveredBar.valorFmt }}
        </text>
        <text
          v-if="hoveredBar.extra"
          :x="tooltipX + 70"
          :y="tooltipY + 4"
          text-anchor="middle"
          class="tooltip-extra"
          font-size="9"
          fill="var(--fg-muted)"
        >
          {{ hoveredBar.extra }}
        </text>
      </g>

      <!-- Focus indicator for keyboard navigation -->
      <rect
        v-if="focused && focusedBarIndex !== null && focusedBarIndex < bars.length"
        :x="bars[focusedBarIndex].x - 4"
        :y="bars[focusedBarIndex].y - 4"
        :width="bars[focusedBarIndex].width + 8"
        :height="bars[focusedBarIndex].maxHeight + 8"
        rx="8"
        class="focus-ring-svg"
        fill="none"
        stroke="var(--brand)"
        stroke-width="2"
        stroke-dasharray="4 4"
      />
    </svg>

    <!-- Legend -->
    <div v-if="showLegend && datos.length > 1" class="chart-legend" role="list" aria-label="Leyenda">
      <div
        v-for="(bar, i) in bars"
        :key="bar.etiqueta"
        class="legend-item"
        :class="{ 'legend-active': highlightedIndex === i }"
        @click="toggleHighlight(i)"
        @keydown.enter="toggleHighlight(i)"
        @keydown.space.prevent="toggleHighlight(i)"
        tabindex="0"
        role="button"
        :aria-pressed="highlightedIndex === i"
      >
        <span
          class="legend-color"
          :style="{ backgroundColor: bar.color }"
          aria-hidden="true"
        />
        <span class="legend-label">{{ bar.etiqueta }}</span>
        <span class="legend-value">{{ bar.valorFmt }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from "vue";

const props = defineProps({
  datos: { type: Array, default: () => [] },
  color: { type: String, default: "#3b82f6" },
  animar: { type: Boolean, default: true },
  duracion: { type: Number, default: 1000 },
  retraso: { type: Number, default: 100 },
  ariaLabel: { type: String, default: "Gráfica de barras" },
  emptyMessage: { type: String, default: "Sin datos para graficar" },
  showGrid: { type: Boolean, default: true },
  showTooltip: { type: Boolean, default: true },
  showLegend: { type: Boolean, default: false },
  showAnimation: { type: Boolean, default: true },
  height: { type: Number, default: 280 },
  maxBars: { type: Number, default: 0 }, // 0 = no limit
});

const emit = defineEmits(["barClick", "barHover", "highlightChange"]);

const reducedMotion = ref(false);
const focused = ref(false);
const focusedBarIndex = ref(null);
const hoveredBar = ref(null);
const highlightedIndex = ref(null);
const bars = ref([]);
const animatedBars = ref([]);

const width = 600;
const height = computed(() => props.height);
const paddingLeft = 56;
const paddingRight = 16;
const paddingTop = 16;
const chartBottom = computed(() => height.value - 36);
const paddingBottom = 36;

const baseColor = props.color;

const maxValue = computed(() => Math.max(1, ...props.datos.map((d) => d.valor)));

const maxDisplayBars = computed(() => props.maxBars || props.datos.length);
const displayDatos = computed(() => props.datos.slice(0, maxDisplayBars.value));

const gridY = computed(() => {
  const hMax = chartBottom.value - paddingTop;
  return [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: chartBottom.value - hMax * f,
    value: Math.round(maxValue.value * (1 - f)),
  }));
});

const baseBars = computed(() => {
  const n = Math.max(1, displayDatos.value.length);
  const slot = (width - paddingLeft - paddingRight) / n;
  const w = Math.min(52, slot * 0.65);
  const hMax = chartBottom.value - paddingTop - paddingBottom;
  const maxVal = maxValue.value;
  const maxIdx = displayDatos.value.findIndex((d) => d.valor === maxVal);

  return displayDatos.value.map((d, i) => {
    const h = d.valor > 0 ? Math.max(4, (d.valor / maxVal) * hMax) : 0;
    const barColor = d.color || baseColor;

    return {
      ...d,
      index: i,
      color: barColor,
      width: w,
      maxHeight: hMax,
      displayHeight: 0,
      x: paddingLeft + slot * i + (slot - w) / 2,
      highlighted: i === maxIdx && d.valor > 0,
    };
});
  });

const formatValue = (val) => {
  if (val >= 1e6) return (val / 1e6).toFixed(1) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toString();
};

const tooltipX = computed(() => {
  if (hoveredBar.value === null) return 0;
  return Math.min(width - 150, Math.max(10, hoveredBar.value.x + hoveredBar.value.width / 2 - 70));
});

const tooltipY = computed(() => {
  if (hoveredBar.value === null) return 0;
  return Math.max(40, hoveredBar.value.y + hoveredBar.value.displayHeight - 10);
});

const duration = props.duracion;
const delay = props.retraso;

function syncBars() {
  if (props.animar && props.showAnimation && !reducedMotion.value) {
    animatedBars.value = [];
    bars.value = baseBars.value.map((b) => ({ ...b, displayHeight: 0 }));
    nextTick(() => {
      animatedBars.value = baseBars.value;
      animateBars();
    });
  } else {
    bars.value = baseBars.value.map((b) => ({ ...b, displayHeight: b.maxHeight }));
    animatedBars.value = bars.value;
  }
}

function animateBars() {
  baseBars.value.forEach((bar, i) => {
    setTimeout(() => {
      const idx = bars.value.findIndex(b => b.index === bar.index);
      if (idx >= 0) {
        bars.value[idx] = { ...bars.value[idx], displayHeight: bar.maxHeight };
      }
    }, i * delay);
  });
}

function onBarEnter(index, bar) {
  if (!showTooltip.value) return;
  hoveredBar.value = bar;
  highlightedIndex.value = index;
  emit("barHover", { bar, index });
}

function onBarLeave() {
  if (!showTooltip.value) return;
  hoveredBar.value = null;
  if (highlightedIndex.value !== null && !focused.value) {
    highlightedIndex.value = null;
  }
}

function onBarClick(index, bar) {
  emit("barClick", { bar, index });
}

function onMouseleave() {
  hoveredBar.value = null;
  if (!focused.value) {
    highlightedIndex.value = null;
  }
}

function onKeydown(e) {
  if (!bars.value.length) return;

  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      focusedBarIndex.value = Math.min(bars.value.length - 1, (focusedBarIndex.value ?? -1) + 1);
      break;
    case "ArrowLeft":
      e.preventDefault();
      focusedBarIndex.value = Math.max(0, (focusedBarIndex.value ?? 1) - 1);
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      if (focusedBarIndex.value !== null) {
        const bar = bars.value[focusedBarIndex.value];
        onBarClick(focusedBarIndex.value, bar);
      }
      break;
    case "Escape":
      focusedBarIndex.value = null;
      break;
  }
}

function toggleHighlight(i) {
  highlightedIndex.value = highlightedIndex.value === i ? null : i;
  emit("highlightChange", highlightedIndex.value);
}

function onMousemove(e) {
  if (!showTooltip.value) return;
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Find bar under cursor
  const bar = bars.value.find(b =>
    x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.maxHeight
  );

  if (bar) {
    hoveredBar.value = bar;
    highlightedIndex.value = bar.index;
  } else {
    hoveredBar.value = null;
    if (!focused) highlightedIndex.value = null;
  }
}

onMounted(() => {
  // Check reduced motion preference
  reducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    reducedMotion.value = e.matches;
  });

  syncBars();
});

watch(
  () => props.datos,
  () => {
    nextTick(syncBars);
  },
  { deep: true }
);

watch(
  () => [props.animar, props.showAnimation, props.color],
  syncBars
);

watch(
  () => props.datos.length,
  syncBars
);
</script>

<style scoped>
.chart-container {
  @apply relative w-full;
}

.chart-svg {
  @apply w-full h-full block;
  max-width: 100%;
}

.chart-empty {
  @apply flex flex-col items-center justify-center py-12 text-center;
  color: var(--fg-muted);
}

.empty-icon {
  @apply w-12 h-12 mb-3 opacity-50;
}

.empty-text {
  @apply text-sm font-medium;
}

.chart-svg:focus {
  outline: none;
}

.grid-lines {
  stroke: var(--card-border);
}

.grid-line {
  stroke-dasharray: 4 4;
}

.axis-line {
  stroke: var(--fg-muted);
  stroke-opacity: 0.5;
}

.y-axis-labels {
  font-variant-numeric: tabular-nums;
}

.axis-label {
  font-variant-numeric: tabular-nums;
}

.bars-group {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.bar-group {
  transition: filter var(--duration-fast) var(--ease-out);
}

.bar-group:hover {
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
}

.bar-highlighted {
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15));
}

.bar-track {
  opacity: 0.3;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.bar-main {
  transition: height var(--duration-slow) var(--ease-spring),
              y var(--duration-slow) var(--ease-spring),
              filter var(--duration-normal) var(--ease-out);
}

.bar-highlight {
  pointer-events: none;
}

.bar-value-label {
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.bar-label {
  pointer-events: none;
  user-select: none;
  transition: fill var(--duration-fast) var(--ease-out);
}

.bar-group:hover .bar-label {
  fill: var(--fg);
}

.tooltip-group {
  pointer-events: none;
  animation: fade-in var(--duration-fast) var(--ease-out);
}

.tooltip-bg {
  fill: var(--card);
  stroke: var(--card-border);
  stroke-width: 1;
}

@keyframes tooltipShadow {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tooltip-label {
  pointer-events: none;
  user-select: none;
}

.tooltip-value {
  pointer-events: none;
  user-select: none;
}

.tooltip-extra {
  pointer-events: none;
  user-select: none;
}

.focus-ring-svg {
  pointer-events: none;
  animation: dash-spin 1s linear infinite;
}

@keyframes dash-spin {
  to { stroke-dashoffset: -8; }
}

.chart-legend {
  @apply flex flex-wrap gap-3 mt-4 pt-4 border-t;
  border-color: var(--card-border);
}

.legend-item {
  @apply flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer
       transition-all duration-fast ease-out;
  background: transparent;
}

.legend-item:hover {
  background: var(--bg-subtle);
}

.legend-item:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.legend-active {
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}

.legend-color {
  @apply w-3 h-3 rounded-full flex-shrink-0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-label {
  @apply text-sm font-medium text-[var(--fg)] flex-1 truncate;
}

.legend-value {
  @apply text-sm font-semibold text-[var(--fg-muted)] font-mono;
}

.legend-active .legend-value {
  color: var(--brand);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .bar-main {
    transition: none !important;
  }
  .bar-group {
    transition: none !important;
  }
}
</style>