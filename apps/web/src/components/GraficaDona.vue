<template>
  <div class="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
    <svg :key="animKey" viewBox="0 0 120 120" class="donut-in h-36 w-36 flex-shrink-0" role="img">
      <circle cx="60" cy="60" r="46" fill="none" class="stroke-zinc-200/70 dark:stroke-white/10" stroke-width="16" />
      <circle
        v-for="s in segmentos"
        :key="s.etiqueta"
        cx="60" cy="60" r="46" fill="none"
        :stroke="s.color"
        stroke-width="16"
        :stroke-dasharray="`${s.len} ${CIRC - s.len}`"
        :stroke-dashoffset="animar ? (s.off + s.len) : s.off"
        stroke-linecap="butt"
        transform="rotate(-90 60 60)"
      >
        <title>{{ s.etiqueta }}: {{ s.count }} ({{ s.pct }}%)</title>
        <animate
          v-if="animar"
          attributeName="stroke-dashoffset"
          :from="s.off + s.len"
          :to="s.off"
          :dur="`${duracion}ms`"
          :begin="`${i * retraso}ms`"
          fill="freeze"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
      </circle>
      <text x="60" y="58" text-anchor="middle" class="fill-zinc-900 dark:fill-zinc-50" font-size="20" font-weight="700">{{ total }}</text>
      <text x="60" y="74" text-anchor="middle" class="fill-zinc-500" font-size="10">{{ centro }}</text>
    </svg>
    <ul class="min-w-0 space-y-1.5 text-sm">
      <li
        v-for="(s, i) in segmentos"
        :key="s.etiqueta"
        class="legend-in flex items-center gap-2"
        :style="{ animationDelay: `${i * 90}ms` }"
      >
        <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ backgroundColor: s.color }"></span>
        <span class="min-w-0 flex-1 truncate">{{ s.etiqueta }}</span>
      </li>
      <li v-if="!segmentos.length" class="text-sm text-zinc-500">Sin datos.</li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'

const props = defineProps({
  datos: { type: Array, default: () => [] },
  centro: { type: String, default: 'total' },
  animar: { type: Boolean, default: true },
  duracion: { type: Number, default: 1000 },
  retraso: { type: Number, default: 100 },
})

const CIRC = 2 * Math.PI * 46

const total = computed(() => props.datos.reduce((a, d) => a + (d.count || 0), 0))

const segmentosBase = computed(() => {
  const t = total.value || 1
  let acc = 0
  return props.datos
    .filter(d => (d.count || 0) > 0)
    .map((d, i) => {
      const frac = (d.count || 0) / (total.value || 1)
      const len = Math.max(frac * CIRC - 2, 2)
      const seg = { ...d, len, off: -acc * CIRC, pct: Math.round(frac * 100), index: i }
      acc += frac
      return seg
    })
})

const segmentos = ref([])
const animKey = ref(0)

const setSegments = (val) => {
  segmentos.value = val
  animKey.value++
}

onMounted(() => {
  if (props.animar) {
    segmentos.value = []
    setTimeout(() => setSegments(segmentosBase.value), 50)
  } else {
    setSegments(segmentosBase.value)
  }
})

watch(() => props.datos, () => {
  if (props.animar) {
    segmentos.value = []
    setTimeout(() => setSegments(segmentosBase.value), 50)
  } else {
    setSegments(segmentosBase.value)
  }
})
</script>

<style scoped>
.donut-in {
  animation: donutIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes donutIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
.legend-in {
  animation: legendIn 0.4s ease-out both;
}
@keyframes legendIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .donut-in,
  .legend-in {
    animation: none !important;
  }
  circle {
    transition: none !important;
  }
}
</style>
