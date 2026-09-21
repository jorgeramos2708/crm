<template>
  <div>
    <svg :viewBox="`0 0 ${ancho} ${alto}`" class="w-full" role="img">
      <g v-for="(b, i) in barras" :key="b.etiqueta">
        <rect
          :x="b.x" :y="b.y" :width="b.w" :height="b.h"
          rx="4"
          :fill="b.destacada ? destacado : base"
          :opacity="b.destacada ? 1 : 0.55"
        >
          <title>{{ b.etiqueta }}: {{ b.valorFmt }} ({{ b.extra }})</title>
        </rect>
        <text :x="b.x + b.w / 2" :y="alto - 6" text-anchor="middle" class="fill-zinc-500" font-size="10">{{ b.etiqueta }}</text>
        <text v-if="b.h > 22" :x="b.x + b.w / 2" :y="b.y + 14" text-anchor="middle" class="fill-white" font-size="10" font-weight="600">{{ b.corto }}</text>
      </g>
      <line :x1="padL" :x2="ancho - 8" :y1="alto - 24" :y2="alto - 24" class="stroke-zinc-200 dark:stroke-zinc-700" stroke-width="1" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  datos: { type: Array, default: () => [] }, // [{ etiqueta, valor, valorFmt, extra, corto }]
  color: { type: String, default: '#3b82f6' },
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

const barras = computed(() => {
  const n = Math.max(1, props.datos.length)
  const slot = (ancho - padL - 8) / n
  const w = Math.min(44, slot * 0.55)
  const hMax = alto - padB - 24
  return props.datos.map((d, i) => {
    const h = Math.max(d.valor > 0 ? 4 : 0, (d.valor / maximo.value) * hMax)
    return {
      ...d,
      w,
      h,
      x: padL + slot * i + (slot - w) / 2,
      y: alto - 24 - h,
      destacada: i === idxMax.value && d.valor > 0,
    }
  })
})

const base = computed(() => props.color)
const destacado = computed(() => props.color)
</script>
