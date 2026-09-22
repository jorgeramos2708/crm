<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
    <header class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <p class="text-sm text-zinc-500">{{ total }} oportunidades</p>
        <Select v-model="alcance" @change="fetchData">
          <option value="">Todas</option>
          <option value="mio">Mías</option>
          <option value="equipo">Mi equipo</option>
        </Select>
      </div>
      <div class="flex gap-2">
        <Btn href="/api/oportunidades/export" variant="outline"
          >Exportar CSV</Btn
        >
        <Btn @click="showNewOportunidad = true">+ Nueva Oportunidad</Btn>
      </div>
    </header>
    <div class="grid grid-cols-5 gap-3">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="p-3 rounded-xl flex flex-col text-white"
        :style="{
          backgroundColor: getStageColor(stage),
          minHeight: '400px',
        }"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-sm">{{ stage.nombre }}</h3>
          <span class="text-xs font-bold">{{ oportunidadesPorStage[stage.id]?.length || 0 }}</span>
        </div>
        <div
          class="space-y-1.5 flex-1 overflow-y-auto"
          @dragover.prevent
          @drop="onDrop(stage.id)"
        >
          <div
            v-for="opp in oportunidadesPorStage[stage.id] || []"
            :key="opp.id"
            class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-grab text-zinc-900 dark:text-zinc-100 group relative"
            draggable="true"
            @dragstart="onDragStart(opp)"
            @dragend="onDragEnd"
          >
            <div class="font-medium text-xs truncate max-w-xs">{{ opp.nombre }}</div>
            <div class="text-[10px] text-zinc-500">{{ formatCurrency(opp.importe) }}</div>
            <div v-if="opp.descripcion" class="absolute z-10 bottom-full left-0 mb-2 w-56 p-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none">
              <p class="font-medium mb-1">{{ opp.nombre }}</p>
              <p class="opacity-80 text-[11px]">{{ opp.descripcion }}</p>
            </div>
          </div>
          <div
            v-if="(oportunidadesPorStage[stage.id] || []).length === 0"
            class="p-3 text-center text-xs text-white/70"
          >
            Sin oportunidades
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Oportunidad -->
    <Modal :open="showNewOportunidad" @close="showNewOportunidad = false">
      <template #title>
        <h2 class="text-xl font-bold mb-4">Nueva Oportunidad</h2>
      </template>
      <form @submit.prevent="crearOportunidad" class="space-y-4">
        <Field label="Pipeline">
          <Select v-model="nuevaOportunidad.pipelineId" required class="w-full">
            <option value="">Seleccionar pipeline</option>
            <option v-for="p in pipelines" :key="p.id" :value="p.id">
              {{ p.nombre }}
            </option>
          </Select>
        </Field>
        <Field label="Etapa">
          <Select v-model="nuevaOportunidad.stageId" required class="w-full">
            <option value="">Seleccionar etapa</option>
            <option v-for="s in stages" :key="s.id" :value="s.id">
              {{ s.nombre }}
            </option>
          </Select>
        </Field>
        <Field label="Nombre">
          <Input
            v-model="nuevaOportunidad.nombre"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Importe">
          <input
            v-model.number="nuevaOportunidad.importe"
            type="number"
            class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
          />
        </Field>
        <Field label="Descripción">
          <Input
            v-model="nuevaOportunidad.descripcion"
            multiline
            :rows="3"
            class="w-full"
          />
        </Field>
        <CustomFields entidad="oportunidad" v-model="nuevaOportunidad.custom" />
        <div class="flex gap-2 pt-4">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="showNewOportunidad = false"
            >Cancelar</Btn
          >
          <Btn
            type="submit"
            class="flex-1"
            :disabled="creando"
            :loading="creando"
            >{{ creando ? "Creando..." : "Crear" }}</Btn
          >
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import { toast } from "../utils/toast";
import { formatCurrency, loadCurrency } from "../utils/currency";
import CustomFields from "../components/CustomFields.vue";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";

const router = useRouter();
const authStore = useAuthStore();

const stages = ref([]);
const oportunidades = ref([]);
const pipelines = ref([]);
const cargando = ref(true);
const alcance = ref("");
const showNewOportunidad = ref(false);
const creando = ref(false);

const nuevaOportunidad = ref({
  nombre: "",
  pipelineId: "",
  stageId: "",
  importe: 0,
  descripcion: "",
  custom: {},
});

const oportunidadesPorStage = computed(() => {
  const grouped = {};
  stages.value.forEach((s) => (grouped[s.id] = []));
  oportunidades.value.forEach((o) => {
    if (grouped[o.stageId]) grouped[o.stageId].push(o);
  });
  return grouped;
});

const total = computed(() => oportunidades.value.length);

const draggedOportunidad = ref(null);

const stageColorMap = {
  nuevo: '#3b82f6',
  calificado: '#f59e0b',
  propuesta: '#a855f7',
  negociación: '#ec4899',
  negociacion: '#ec4899',
  ganado: '#22c55e',
  won: '#22c55e',
  closed: '#22c55e',
  lost: '#ef4444',
}

const getStageColor = (stage) => {
  const name = stage.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return stage.color || stageColorMap[name] || '#3b82f6'
}

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

const getStagePastelColor = (stage) => {
  const hex = getStageColor(stage)
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.round(r + (255 - r) * 0.7)}, ${Math.round(g + (255 - g) * 0.7)}, ${Math.round(b + (255 - b) * 0.7)})`
}

const getStageTextColor = (stage) => {
  const hex = getStageColor(stage)
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#374151' : '#ffffff'
}

const fetchData = async () => {
  try {
    const [stagesRes, oppsRes, pipelinesRes] = await Promise.all([
      axios.get("/api/pipeline-stages"),
      axios.get("/api/oportunidades", {
        params: alcance.value
          ? { alcance: alcance.value, limit: 200 }
          : { limit: 200 },
      }),
      axios.get("/api/pipelines"),
    ]);
    stages.value = stagesRes.data.data || stagesRes.data;
    oportunidades.value = oppsRes.data.data || oppsRes.data;
    pipelines.value = pipelinesRes.data.data || pipelinesRes.data;
  } catch (e) {
    console.error("Error fetching data:", e);
    toast.error("Error al cargar el pipeline");
  } finally {
    cargando.value = false;
  }
};

const crearOportunidad = async () => {
  if (
    !nuevaOportunidad.value.nombre ||
    !nuevaOportunidad.value.pipelineId ||
    !nuevaOportunidad.value.stageId
  ) {
    toast.error("Complete los campos obligatorios");
    return;
  }
  creando.value = true;
  try {
    const response = await axios.post(
      "/api/oportunidades",
      nuevaOportunidad.value,
    );
    oportunidades.value.push(response.data.data || response.data);
    showNewOportunidad.value = false;
    nuevaOportunidad.value = {
      nombre: "",
      pipelineId: "",
      stageId: "",
      importe: 0,
      descripcion: "",
      custom: {},
    };
  } catch (e) {
    console.error("Error creating oportunidad:", e);
    toast.error("Error al crear oportunidad");
  } finally {
    creando.value = false;
  }
};

const onDragStart = (opp) => {
  draggedOportunidad.value = opp;
};

const onDragEnd = () => {
  draggedOportunidad.value = null;
};

const onDrop = async (stageId) => {
  const opp = draggedOportunidad.value;
  draggedOportunidad.value = null;
  if (!opp || opp.stageId === stageId) return;
  try {
    await axios.put(`/api/oportunidades/${opp.id}`, { stageId });
    opp.stageId = stageId;
  } catch (e) {
    console.error("Error moving oportunidad:", e);
    toast.error(e.response?.data?.error || "Error al mover la oportunidad");
    await fetchData();
  }
};

onMounted(async () => {
  await loadCurrency();
  await fetchData();
});
</script>

<style scoped>
[draggable="true"] {
  cursor: grab;
}
[draggable="true"]:active {
  cursor: grabbing;
}
</style>
