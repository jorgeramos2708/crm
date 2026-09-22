<template>
  <div>
    <svg :viewBox="`0 0 ${ancho} ${alto}`" class="w-full" role="img">
      <g v-for="(b, i) in barrasAnimadas" :key="b.etiqueta">
        <rect
          :x="b.x" :y="b.y" :width="b.w" :height="b.h"
          rx="4"
          :fill="b.destacada ? destacado : base"
          :opacity="b.destacada ? 1 : 0.55"
        >
          <title>{{ b.etiqueta }}: {{ b.valorFmt }} ({{ b.extra }})</title>
          <animate
            v-if="animar"
            attributeName="height"
            :from="0"
            :to="b.h"
            :dur="`${duracion}ms`"
            :begin="`${i * retraso}ms`"
            fill="freeze"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
          <animate
            v-if="animar"
            attributeName="y"
            :from="alto - 24"
            :to="b.y"
            :dur="`${duracion}ms`"
            :begin="`${i * retraso}ms`"
            fill="freeze"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
        </rect>
        <text :x="b.x + b.w / 2" :y="alto - 6" text-anchor="middle" class="fill-zinc-500" font-size="10">{{ b.etiqueta }}</text>
        <text v-if="b.h > 22" :x="b.x + b.w / 2" :y="b.y + 14" text-anchor="middle" class="fill-white" font-size="10" font-weight="600">{{ b.corto }}</text>
      </g>
      <line :x1="padL" :x2="ancho - 8" :y1="alto - 24" :y2="alto - 24" class="stroke-zinc-200 dark:stroke-zinc-700" stroke-width="1" />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'

const props = defineProps({
  datos: { type: Array, default: () => [] },
  color: { type: String, default: '#3b82f6' },
  animar: { type: Boolean, default: true },
  duracion: { type: Number, default: 800 },
  retraso: { type: Number, default: 80 },
})

const ancho = 560
const alto = 220
const padL = 8
const padB = 30

const maximo = computed(() => Math.max(1, ...props.datos.map(d => d.valor)))
const idxMax = computed(() => {
  let m = -1
  props.datos.forEach((d, i) => { if (d.valor === maximo.value && m === -1) m = i })
  return m
})

const barrasBase = computed(() => {
  const n = Math.max(1, props.datos.length)
  const slot = (ancho - padL - 8) / n
  const w = Math.min(44, slot * 0.55)
  const hMax = alto - padB - 24
  return props.datos.map((d, i) => {
    const h = Math.max(d.valor > 0 ? 4 : 0, (d.valor / maximo.value) * (alto - padB - 24))
    return {
      ...d,
      w: Math.min(44, ((ancho - 8 - 8) / Math.max(1, props.datos.length)) * 0.55),
      h,
      x: 8 + ((560 - 8 - 8) / Math.max(1, props.datos.length)) * i + (((560 - 8 - 8) / Math.max(1, props.datos.length)) - Math.min(44, ((560 - 8 - 8) / Math.max(1, props.datos.length)) * 0.55)) / 2,
      y: 220 - 30 - h,
      hMax: 220 - 30 - 24,
      destacada: i === (props.datos.findIndex(d => d.valor === Math.max(1, ...props.datos.map(d => d.valor)))) && d.valor > 0,
    }
  })
})

const barrasAnimadas = ref([])

const animarEntrada = () => {
  barrasAnimadas.value = barrasBase.value
}

onMounted(() => {
  if (props.animar) {
    barrasAnimadas.value = []
    setTimeout(() => {
      barrasAnimadas.value = barrasBase.value
    }, 50)
  } else {
    barrasAnimadas.value = barrasBase.value
  }
})

watch(() => props.datos, () => {
  if (props.animar) {
    barrasAnimadas.value = []
    setTimeout(() => {
      barrasAnimadas.value = barrasBase.value
    }, 50)
  } else {
    barrasAnimadas.value = barrasBase.value
  }
})
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  rect {
    transition: none !important;
  }
}
</style>
