<template>
  <div ref="raizRef" class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        :value="texto"
        @input="onInput($event.target.value)"
        @focus="openCalendar"
        type="text"
        inputmode="numeric"
        placeholder="DD/MM/AAAA"
        :required="required"
        :class="[
          $attrs.class ||
            'w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700',
          'pr-11',
        ]"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        aria-label="Abrir calendario"
        @click="toggleCalendar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="abierto"
        ref="calendarioRef"
        class="fixed z-[60] w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        :style="posStyle"
      >
      <div class="mb-2 flex items-center justify-between">
        <button
          type="button"
          class="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Mes anterior"
          @click="mesAnterior"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div class="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">
          {{ MESES[vistaMes] }} {{ vistaAnio }}
        </div>
        <button
          type="button"
          class="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          aria-label="Mes siguiente"
          @click="mesSiguiente"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-zinc-400">
        <span v-for="d in DIAS" :key="d">{{ d }}</span>
      </div>

      <div class="grid grid-cols-7 gap-0.5">
        <button
          v-for="(celda, i) in celdas"
          :key="i"
          type="button"
          class="h-8 rounded-md text-sm transition-colors"
          :class="
            celda.esHoy
              ? 'font-bold text-blue-600 dark:text-blue-400'
              : celda.seleccionado
                ? 'bg-blue-600 font-medium text-white'
                : celda.dentro
                  ? 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  : 'text-zinc-300 dark:text-zinc-600'
          "
          :disabled="!celda.dentro"
          @click="seleccionar(celda)"
        >
          {{ celda.dia }}
        </button>
      </div>

      <div class="mt-2 flex justify-between border-t border-zinc-100 pt-2 dark:border-zinc-700">
        <button
          type="button"
          class="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          @click="hoy"
        >
          Hoy
        </button>
        <button
          type="button"
          class="text-xs font-medium text-zinc-500 hover:underline"
          @click="limpiar"
        >
          Limpiar
        </button>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: String, default: "" },
  required: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

const abierto = ref(false);
const calendarioRef = ref(null);
const inputRef = ref(null);
const raizRef = ref(null);
const posStyle = ref({});
const ahora = new Date();
const vistaMes = ref(ahora.getMonth());
const vistaAnio = ref(ahora.getFullYear());

const isoAtexto = (iso) => {
  if (!iso) return "";
  const m = String(iso)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const texto = ref(isoAtexto(props.modelValue));

watch(
  () => props.modelValue,
  (v) => {
    texto.value = isoAtexto(v);
    if (v) {
      const m = String(v).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        vistaMes.value = Number(m[2]) - 1;
        vistaAnio.value = Number(m[1]);
      }
    }
  },
);

const onInput = (v) => {
  const digitos = v.replace(/\D/g, "").slice(0, 8);
  let t = digitos;
  if (t.length > 2) t = t.slice(0, 2) + "/" + t.slice(2);
  if (t.length > 5) t = t.slice(0, 5) + "/" + t.slice(5);
  texto.value = t;
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const valida =
      d.getFullYear() === Number(m[3]) &&
      d.getMonth() === Number(m[2]) - 1 &&
      d.getDate() === Number(m[1]);
    emit("update:modelValue", valida ? `${m[3]}-${m[2]}-${m[1]}` : "");
    if (valida) {
      vistaMes.value = Number(m[2]) - 1;
      vistaAnio.value = Number(m[3]);
    }
  } else {
    emit("update:modelValue", "");
  }
};

const claveIso = (y, m, d) => {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

const celdas = computed(() => {
  const primero = new Date(vistaAnio.value, vistaMes.value, 1);
  const offset = (primero.getDay() + 6) % 7;
  const diasEnMes = new Date(vistaAnio.value, vistaMes.value + 1, 0).getDate();
  const diasPrevio = new Date(vistaAnio.value, vistaMes.value, 0).getDate();
  const hoy = new Date();
  const hoyIso = claveIso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const selIso = props.modelValue || "";

  const lista = [];
  for (let i = 0; i < 42; i++) {
    const diaNum = i - offset + 1;
    let y = vistaAnio.value;
    let m = vistaMes.value;
    let dia;
    let dentro = true;
    if (diaNum < 1) {
      dia = diasPrevio + diaNum;
      m -= 1;
      if (m < 0) {
        m = 11;
        y -= 1;
      }
      dentro = false;
    } else if (diaNum > diasEnMes) {
      dia = diaNum - diasEnMes;
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
      dentro = false;
    } else {
      dia = diaNum;
    }
    const iso = claveIso(y, m, dia);
    lista.push({
      dia,
      iso,
      dentro,
      esHoy: iso === hoyIso,
      seleccionado: iso === selIso,
    });
  }
  return lista;
});

const posicionar = () => {
  const el = inputRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const calW = 288;
  const calH = 340;
  const margin = 8;
  let left = r.left;
  if (left + calW > window.innerWidth - margin)
    left = Math.max(margin, r.right - calW);
  if (left < margin) left = margin;
  let top = r.bottom + 4;
  if (top + calH > window.innerHeight - margin)
    top = Math.max(margin, r.top - calH - 4);
  posStyle.value = { left: `${left}px`, top: `${top}px` };
};

const abrir = () => {
  abierto.value = true;
  if (props.modelValue) {
    const m = String(props.modelValue)
      .slice(0, 10)
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      vistaMes.value = Number(m[2]) - 1;
      vistaAnio.value = Number(m[1]);
    }
  } else {
    const h = new Date();
    vistaMes.value = h.getMonth();
    vistaAnio.value = h.getFullYear();
  }
  posicionar();
};

const toggleCalendar = () => {
  abierto.value ? (abierto.value = false) : abrir();
};

const openCalendar = () => {
  if (!abierto.value) abrir();
};

const cerrar = () => {
  abierto.value = false;
};

const seleccionar = (celda) => {
  if (!celda.dentro) return;
  emit("update:modelValue", celda.iso);
  texto.value = isoAtexto(celda.iso);
  cerrar();
};

const hoy = () => {
  const h = new Date();
  const iso = claveIso(h.getFullYear(), h.getMonth(), h.getDate());
  emit("update:modelValue", iso);
  texto.value = isoAtexto(iso);
  vistaMes.value = h.getMonth();
  vistaAnio.value = h.getFullYear();
  cerrar();
};

const limpiar = () => {
  emit("update:modelValue", "");
  texto.value = "";
  cerrar();
};

const mesAnterior = () => {
  if (vistaMes.value === 0) {
    vistaMes.value = 11;
    vistaAnio.value -= 1;
  } else {
    vistaMes.value -= 1;
  }
};

const mesSiguiente = () => {
  if (vistaMes.value === 11) {
    vistaMes.value = 0;
    vistaAnio.value += 1;
  } else {
    vistaMes.value += 1;
  }
};

const onClickFuera = (e) => {
  if (!abierto.value) return;
  const enRaiz = raizRef.value && raizRef.value.contains(e.target);
  const enCal = calendarioRef.value && calendarioRef.value.contains(e.target);
  if (!enRaiz && !enCal) cerrar();
};

onMounted(() => document.addEventListener("mousedown", onClickFuera));
onBeforeUnmount(() => document.removeEventListener("mousedown", onClickFuera));
</script>
