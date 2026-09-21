<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Select v-model="filtros.alcance" @change="fetchTareas">
        <option value="">Todas</option>
        <option value="mio">Mías</option>
        <option value="equipo">Mi equipo</option>
      </Select>
      <VistasGuardadas
        entidad="tarea"
        :capturar="() => ({ ...filtros.value })"
        :aplicar="
          (f) => {
            filtros.value = { alcance: '', ...f };
            fetchTareas();
          }
        "
      />
      <div class="ml-auto">
        <Btn @click="openModal(null)">+ Nueva Tarea</Btn>
      </div>
    </div>

    <Card v-if="cargando && !tareas.length" class="p-6 mb-4"
      ><Skeleton :filas="4"
    /></Card>
    <div class="flex gap-4 overflow-x-auto pb-8">
      <Card
        v-for="col in columnas"
        :key="col.estado"
        class="p-4 min-w-[280px] flex-shrink-0 flex flex-col"
        style="min-height: 400px"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium">{{ col.titulo }}</h3>
          <Badge
            color="zinc"
            variant="pill"
            :dot="false"
            class="tabular-nums"
            >{{ (tareasPorEstado[col.estado] || []).length }}</Badge
          >
        </div>
        <div
          class="space-y-2 flex-1 overflow-y-auto"
          @dragover.prevent
          @drop="onDrop(col.estado)"
        >
          <div
            v-for="t in tareasPorEstado[col.estado] || []"
            :key="t.id"
            class="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-grab"
            draggable="true"
            @dragstart="onDragStart(t)"
            @dragend="onDragEnd"
          >
            <div class="font-medium text-sm">{{ t.titulo }}</div>
            <div
              v-if="t.descripcion"
              class="text-xs text-zinc-500 mt-1 line-clamp-2"
            >
              {{ t.descripcion }}
            </div>
            <div class="flex items-center justify-between mt-2">
              <Badge
                :color="colorPrioridad[t.prioridad] || 'zinc'"
                variant="pill"
                :dot="false"
                >{{ t.prioridad }}</Badge
              >
              <span v-if="t.vencimiento" class="text-[11px] text-zinc-500">{{
                formatFecha(t.vencimiento)
              }}</span>
            </div>
            <div
              v-if="t._vinculo"
              class="text-[11px] text-zinc-500 mt-1 truncate flex items-center gap-1"
            >
              <Icon name="vinculo" class="h-3 w-3" /> {{ t._vinculo }}
            </div>
            <div class="flex gap-3 mt-2 text-xs">
              <button
                @click="openModal(t)"
                class="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button @click="eliminar(t)" class="text-red-600 hover:underline">
                Eliminar
              </button>
            </div>
          </div>
          <div
            v-if="!(tareasPorEstado[col.estado] || []).length"
            class="p-4 text-center text-sm text-zinc-400"
          >
            Arrastra tareas aquí
          </div>
        </div>
      </Card>
    </div>

    <Modal
      :open="showModal"
      max-width="max-w-md"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="showModal = false"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editing ? "Editar Tarea" : "Nueva Tarea" }}
        </h2>
      </template>
      <form @submit.prevent="guardar" class="space-y-4">
        <Field label="Título" required>
          <Input v-model="form.titulo" type="text" required class="w-full" />
        </Field>
        <Field label="Descripción">
          <Input
            v-model="form.descripcion"
            multiline
            :rows="3"
            class="w-full"
          />
        </Field>
        <div class="grid grid-cols-2 gap-3">
          <Field label="Estado">
            <Select v-model="form.estado" class="w-full">
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select v-model="form.prioridad" class="w-full">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </Select>
          </Field>
        </div>
        <div>
          <label class="block text-sm mb-1">Vencimiento</label>
          <FechaInput v-model="form.vencimiento" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <Field label="Vincular a">
            <Select v-model="form.entityType" class="w-full">
              <option value="">Sin vínculo</option>
              <option value="contacto">Contacto</option>
              <option value="empresa">Empresa</option>
              <option value="oportunidad">Oportunidad</option>
            </Select>
          </Field>
          <Field label="Registro">
            <Select v-model="form.entityId" class="w-full">
              <option value="">—</option>
              <option v-for="r in vinculos" :key="r.id" :value="r.id">
                {{ r.nombre }}
              </option>
            </Select>
          </Field>
        </div>
        <div class="flex gap-2 pt-2">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="showModal = false"
            >Cancelar</Btn
          >
          <Btn type="submit" variant="primary" class="flex-1">Guardar</Btn>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import VistasGuardadas from "../components/VistasGuardadas.vue";
import FechaInput from "../components/FechaInput.vue";
import Skeleton from "../components/Skeleton.vue";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Icon from "../components/Icon.vue";

const ESTADOS = ["pendiente", "en_progreso", "completada", "cancelada"];
const TITULOS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

const tareas = ref([]);
const cargando = ref(true);
const contactos = ref([]);
const empresas = ref([]);
const oportunidades = ref([]);
const showModal = ref(false);
const editing = ref(null);
const filtros = ref({ alcance: "" });
const form = ref({
  titulo: "",
  descripcion: "",
  estado: "pendiente",
  prioridad: "media",
  vencimiento: "",
  entityType: "",
  entityId: "",
});
const arrastrando = ref(null);

const columnas = computed(() =>
  ESTADOS.map((e) => ({ estado: e, titulo: TITULOS[e] })),
);
const tareasPorEstado = computed(() => {
  const g = {};
  ESTADOS.forEach((e) => {
    g[e] = [];
  });
  tareas.value.forEach((t) => {
    (g[t.estado] || g.pendiente).push(t);
  });
  return g;
});

const vinculos = computed(() => {
  if (form.value.entityType === "contacto") return contactos.value;
  if (form.value.entityType === "empresa") return empresas.value;
  if (form.value.entityType === "oportunidad") return oportunidades.value;
  return [];
});

const colorPrioridad = {
  alta: "red",
  media: "yellow",
  baja: "zinc",
};

const formatFecha = (d) => {
  try {
    const m = String(d)
      .slice(0, 10)
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m
      ? `${m[3]}/${m[2]}/${m[1]}`
      : new Date(d).toLocaleDateString("es-MX");
  } catch {
    return "";
  }
};

const fetchTareas = async () => {
  cargando.value = true;
  try {
    const params = { limit: 200 };
    if (filtros.value.alcance) params.alcance = filtros.value.alcance;
    const { data } = await axios.get("/api/tareas", { params });
    const nombres = {};
    [...contactos.value, ...empresas.value, ...oportunidades.value].forEach(
      (r) => {
        nombres[r.id] = r.nombre;
      },
    );
    tareas.value = (data.data || []).map((t) => ({
      ...t,
      _vinculo: t.entityId ? nombres[t.entityId] || "" : "",
    }));
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar tareas");
  } finally {
    cargando.value = false;
  }
};

const onDragStart = (t) => {
  arrastrando.value = t;
};
const onDragEnd = () => {
  arrastrando.value = null;
};

const onDrop = async (estado) => {
  const t = arrastrando.value;
  arrastrando.value = null;
  if (!t || !t.id || t.estado === estado) return;
  const anterior = t.estado;
  t.estado = estado;
  try {
    await axios.put(`/api/tareas/${t.id}`, { estado });
  } catch (e) {
    t.estado = anterior;
    toast.error(e.response?.data?.error || "Error moviendo la tarea");
    await fetchTareas();
  }
};

const openModal = (t) => {
  editing.value = t;
  form.value = t
    ? {
        titulo: t.titulo,
        descripcion: t.descripcion || "",
        estado: t.estado,
        prioridad: t.prioridad,
        vencimiento: t.vencimiento ? t.vencimiento.slice(0, 10) : "",
        entityType: t.entityType || "",
        entityId: t.entityId || "",
      }
    : {
        titulo: "",
        descripcion: "",
        estado: "pendiente",
        prioridad: "media",
        vencimiento: "",
        entityType: "",
        entityId: "",
      };
  showModal.value = true;
};

const guardar = async () => {
  if (!form.value.titulo) {
    toast.error("Campo obligatorio: título");
    return;
  }
  const payload = { ...form.value };
  if (!payload.entityType) {
    payload.entityType = null;
    payload.entityId = null;
  }
  if (!payload.vencimiento) payload.vencimiento = null;
  try {
    if (editing.value?.id)
      await axios.put(`/api/tareas/${editing.value.id}`, payload);
    else await axios.post("/api/tareas", payload);
    showModal.value = false;
    await fetchTareas();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error guardando");
  }
};

const eliminar = async (t) => {
  if (!t?.id || !(await confirmar(`¿Eliminar "${t.titulo}"?`))) return;
  try {
    await axios.delete(`/api/tareas/${t.id}`);
    await fetchTareas();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error eliminando");
  }
};

watch(
  () => form.value.entityType,
  () => {
    form.value.entityId = "";
  },
);

onMounted(async () => {
  try {
    const [c, e, o] = await Promise.all([
      axios.get("/api/contactos", { params: { limit: 200 } }),
      axios.get("/api/companies", { params: { limit: 200 } }),
      axios.get("/api/oportunidades", { params: { limit: 200 } }),
    ]);
    contactos.value = c.data.data || [];
    empresas.value = e.data.data || [];
    oportunidades.value = o.data.data || [];
  } catch {
    /* */
  }
  await fetchTareas();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
[draggable="true"] {
  cursor: grab;
}
[draggable="true"]:active {
  cursor: grabbing;
}
</style>
