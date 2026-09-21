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
    <div class="flex gap-4 overflow-x-auto pb-8" style="min-width: 100%">
      <Card
        v-for="stage in stages"
        :key="stage.id"
        class="p-4 min-w-[280px] flex-shrink-0 flex flex-col"
        :style="{
          borderTop: '3px solid ' + (stage.color || '#3b82f6'),
          minHeight: '500px',
        }"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Badge :hex="stage.color || '#3b82f6'" dot-size="h-3 w-3" />
            <h3 class="text-lg font-medium text-zinc-900 dark:text-zinc-400">
              {{ stage.nombre }}
            </h3>
          </div>
        </div>
        <div
          class="space-y-2 flex-1 overflow-y-auto"
          @dragover.prevent
          @drop="onDrop(stage.id)"
        >
          <div
            v-for="opp in oportunidadesPorStage[stage.id] || []"
            :key="opp.id"
            class="p-3 rounded-md bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 mb-2 cursor-grab"
            draggable="true"
            @dragstart="onDragStart(opp)"
            @dragend="onDragEnd"
          >
            <div
              class="font-medium text-zinc-900 dark:text-zinc-300 truncate max-w-xs"
            >
              {{ opp.nombre }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ formatCurrency(opp.importe) }}
            </div>
          </div>
          <div
            v-if="(oportunidadesPorStage[stage.id] || []).length === 0"
            class="p-4 text-center text-zinc-400 dark:text-zinc-600"
          >
            <p>No hay oportunidades</p>
          </div>
        </div>
      </Card>
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

const alcance = ref("");

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
