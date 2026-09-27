<!-- GraficaBarras: barras SVG FOSS con grid, empty state y a11y.
  props: datos [{etiqueta, valor, valorFmt?, extra?, corto?}], color, animar. -->
<template>
  <div>
    <p
      v-if="!datos.length"
      class="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
      role="status"
    >
      Sin datos para graficar.
    </p>
    <svg
      v-else
      :viewBox="`0 0 ${ancho} ${alto}`"
      class="w-full"
      role="img"
      :aria-label="ariaLabel"
    >
      <g aria-hidden="true">
        <line
          v-for="g in gridY"
          :key="g.y"
          :x1="padL"
          :x2="ancho - 8"
          :y1="g.y"
          :y2="g.y"
          class="stroke-zinc-100 dark:stroke-zinc-800"
          stroke-width="1"
        />
      </g>
      <g v-for="(b, i) in barrasAnimadas" :key="b.etiqueta">
        <rect
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
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
        <text
          :x="b.x + b.w / 2"
          :y="alto - 6"
          text-anchor="middle"
          class="fill-zinc-500"
          font-size="10"
        >
          {{ b.etiqueta }}
        </text>
        <text
          v-if="b.h > 22"
          :x="b.x + b.w / 2"
          :y="b.y + 14"
          text-anchor="middle"
          class="fill-white"
          font-size="10"
          font-weight="600"
        >
          {{ b.corto }}
        </text>
      </g>
      <line
        :x1="padL"
        :x2="ancho - 8"
        :y1="alto - 24"
        :y2="alto - 24"
        class="stroke-zinc-200 dark:stroke-zinc-700"
        stroke-width="1"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";

const props = defineProps({
  datos: { type: Array, default: () => [] },
  color: { type: String, default: "#3b82f6" },
  animar: { type: Boolean, default: true },
  duracion: { type: Number, default: 800 },
  retraso: { type: Number, default: 80 },
  ariaLabel: { type: String, default: "Gráfica de barras" },
});

const ancho = 560;
const alto = 220;
const padL = 8;
const padB = 30;

const base = props.color;
const destacado = props.color;

const maximo = computed(() => Math.max(1, ...props.datos.map((d) => d.valor)));

const gridY = computed(() => {
  const hMax = alto - padB - 24;
  return [0.25, 0.5, 0.75, 1].map((f) => ({
    y: alto - 24 - hMax * f,
  }));
});

const barrasBase = computed(() => {
  const n = Math.max(1, props.datos.length);
  const slot = (ancho - 16) / n;
  const w = Math.min(44, slot * 0.55);
  const hMax = alto - padB - 24;
  const maxVal = maximo.value;
  const maxIdx = props.datos.findIndex((d) => d.valor === maxVal);
  return props.datos.map((d, i) => {
    const h = Math.max(d.valor > 0 ? 4 : 0, (d.valor / maxVal) * hMax);
    return {
      ...d,
      w,
      h,
      x: 8 + slot * i + (slot - w) / 2,
      y: alto - 24 - h,
      destacada: i === maxIdx && d.valor > 0,
    };
  });
});

const barrasAnimadas = ref([]);

const sync = () => {
  if (props.animar) {
    barrasAnimadas.value = [];
    setTimeout(() => {
      barrasAnimadas.value = barrasBase.value;
    }, 50);
  } else {
    barrasAnimadas.value = barrasBase.value;
  }
};

onMounted(sync);
watch(() => props.datos, sync);
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  rect {
    transition: none !important;
  }
}
</style>
