<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
    <svg viewBox="0 0 120 120" class="h-36 w-36 flex-shrink-0" role="img">
      <circle cx="60" cy="60" r="46" fill="none" class="stroke-zinc-200/70 dark:stroke-white/10" stroke-width="16" />
      <circle
        v-for="s in segmentos"
        :key="s.etiqueta"
        cx="60" cy="60" r="46" fill="none"
        :stroke="s.color"
        stroke-width="16"
        :stroke-dasharray="`${s.len} ${CIRC - s.len}`"
        :stroke-dashoffset="s.off"
        stroke-linecap="butt"
        transform="rotate(-90 60 60)"
      >
        <title>{{ s.etiqueta }}: {{ s.count }} ({{ s.pct }}%)</title>
      </circle>
      <text x="60" y="58" text-anchor="middle" class="fill-zinc-900 dark:fill-zinc-50" font-size="20" font-weight="700">{{ total }}</text>
      <text x="60" y="74" text-anchor="middle" class="fill-zinc-500" font-size="10">{{ centro }}</text>
    </svg>
    <ul class="w-full min-w-0 space-y-1.5 text-sm">
      <li v-for="s in segmentos" :key="s.etiqueta" class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ backgroundColor: s.color }"></span>
        <span class="min-w-0 flex-1 truncate">{{ s.etiqueta }}</span>
        <span class="tabular-nums text-zinc-500">{{ s.count }} · {{ s.pct }}%</span>
      </li>
      <li v-if="!segmentos.length" class="text-sm text-zinc-500">Sin datos.</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  datos: { type: Array, default: () => [] }, // [{ etiqueta, count, color }]
  centro: { type: String, default: 'total' },
})

const CIRC = 2 * Math.PI * 46

const total = computed(() => props.datos.reduce((a, d) => a + (d.count || 0), 0))

const segmentos = computed(() => {
  const t = total.value || 1
  let acc = 0
  return props.datos
    .filter(d => (d.count || 0) > 0)
    .map(d => {
      const frac = (d.count || 0) / t
      const len = Math.max(frac * CIRC - 2, 2)
      const seg = { ...d, len, off: -acc * CIRC, pct: Math.round(frac * 100) }
      acc += frac
      return seg
    })
})
</script>
