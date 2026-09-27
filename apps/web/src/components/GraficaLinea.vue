<!-- GraficaLinea: serie temporal SVG FOSS (área + línea + puntos).
  props: datos [{etiqueta, valor, valorFmt?}], color, animar, ariaLabel. -->
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
      :class="{ 'anim-on': animar }"
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
      <path :d="areaPath" :fill="color" opacity="0.12" class="line-area" />
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="line-path"
      />
      <g v-for="p in puntos" :key="p.etiqueta">
        <circle :cx="p.x" :cy="p.y" r="4" :fill="color">
          <title>{{ p.etiqueta }}: {{ p.valorFmt }}</title>
        </circle>
        <text
          v-if="mostrarEtiquetas"
          :x="p.x"
          :y="alto - 6"
          text-anchor="middle"
          class="fill-zinc-500"
          font-size="10"
        >
          {{ p.etiqueta }}
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
import { computed } from "vue";

const props = defineProps({
  datos: { type: Array, default: () => [] },
  color: { type: String, default: "#3b82f6" },
  animar: { type: Boolean, default: true },
  mostrarEtiquetas: { type: Boolean, default: true },
  ariaLabel: { type: String, default: "Gráfica de línea" },
});

const ancho = 560;
const alto = 220;
const padL = 16;
const padB = 30;
const hMax = alto - padB - 24;

const maximo = computed(() => Math.max(1, ...props.datos.map((d) => d.valor)));

const gridY = computed(() =>
  [0.25, 0.5, 0.75, 1].map((f) => ({ y: alto - 24 - hMax * f })),
);

const puntos = computed(() => {
  const n = Math.max(1, props.datos.length - 1);
  const span = ancho - padL - 8;
  return props.datos.map((d, i) => {
    const h = Math.max(d.valor > 0 ? 3 : 0, (d.valor / maximo.value) * hMax);
    return {
      ...d,
      x: padL + (span * i) / n,
      y: alto - 24 - h,
    };
  });
});

const linePath = computed(() => {
  if (!puntos.value.length) return "";
  return puntos.value
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
});

const areaPath = computed(() => {
  if (!puntos.value.length) return "";
  const base = alto - 24;
  const first = puntos.value[0];
  const last = puntos.value[puntos.value.length - 1];
  return `${linePath.value} L${last.x} ${base} L${first.x} ${base} Z`;
});
</script>

<style scoped>
.line-path {
  stroke-dasharray: 1200;
  stroke-dashoffset: 0;
}
.anim-on .line-path {
  animation: draw-line 1s ease forwards;
}
@keyframes draw-line {
  from {
    stroke-dashoffset: 1200;
  }
  to {
    stroke-dashoffset: 0;
  }
}
.line-area {
  animation: area-in 0.8s ease both;
}
@keyframes area-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.12;
  }
}
@media (prefers-reduced-motion: reduce) {
  .line-path,
  .line-area {
    animation: none !important;
  }
}
</style>
