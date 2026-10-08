<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2 justify-end">
      <Btn @click="openModal(null)" variant="icon">+</Btn>
    </div>

    <Card v-if="cargando && !tareas.length" class="p-6 mb-4"
      ><Skeleton :filas="4"
    /></Card>
    <div class="grid grid-cols-4 gap-3">
      <div
        v-for="col in columnas"
        :key="col.estado"
        class="p-3 rounded-xl flex flex-col"
        :class="COLOR_COLUMNA[col.estado]"
        style="min-height: 400px"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-sm" :class="COLOR_TEXTO[col.estado]">
            {{ col.titulo }}
          </h3>
          <Badge
            :color="COLOR_BADGE[col.estado]"
            variant="pill"
            :dot="false"
            class="tabular-nums text-xs"
            >{{ (tareasPorEstado[col.estado] || []).length }}</Badge
          >
        </div>
        <div
          v-auto-animate
          class="space-y-2 flex-1 overflow-y-auto rounded-lg transition-colors"
          :class="
            dropTarget === col.estado && arrastrando
              ? 'ring-2 ring-inset ring-blue-400/70 bg-blue-100/40 dark:bg-blue-500/10'
              : ''
          "
          @dragover.prevent="onDragOver(col.estado)"
          @dragleave="onDragLeave(col.estado)"
          @drop="onDrop(col.estado)"
        >
          <div
            v-for="t in tareasPorEstado[col.estado] || []"
            :key="t.id"
            class="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-opacity"
            :class="
              bloqueada(t)
                ? 'cursor-default opacity-70'
                : arrastrando?.id === t.id
                  ? 'opacity-40 scale-[0.98]'
                  : 'cursor-grab'
            "
            :draggable="!bloqueada(t)"
            :title="t.descripcion || t.titulo"
            @dragstart="onDragStart(t, $event)"
            @dragend="onDragEnd"
          >
            <div
              class="font-medium text-xs"
              :class="
                t.estado === 'completada' || t.estado === 'cancelada'
                  ? 'line-through text-zinc-500'
                  : ''
              "
            >
              {{ t.titulo }}
            </div>
            <div
              v-if="t.descripcion"
              class="text-[11px] text-zinc-500 mt-0.5 line-clamp-2"
            >
              {{ t.descripcion }}
            </div>
            <div class="flex items-center justify-between mt-1.5">
              <Badge
                :color="colorPrioridad[t.prioridad] || 'zinc'"
                variant="pill"
                :dot="false"
                class="text-[10px]"
                >{{ t.prioridad }}</Badge
              >
              <span v-if="t.vencimiento" class="text-[10px] text-zinc-500">{{
                formatFecha(t.vencimiento)
              }}</span>
            </div>
            <div
              v-if="t._vinculo"
              class="text-[10px] text-zinc-500 mt-0.5 truncate flex items-center gap-1"
            >
              <Icon name="vinculo" class="h-2.5 w-2.5" /> {{ t._vinculo }}
            </div>
            <div class="flex gap-1 mt-1.5">
              <Btn
                variant="ghost"
                size="sm"
                title="Editar"
                aria-label="Editar"
                @click="openModal(t)"
              >
                <Icon name="editar" class="h-4 w-4" />
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                class="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Eliminar"
                aria-label="Eliminar"
                @click="eliminar(t)"
              >
                <Icon name="eliminar" class="h-4 w-4" />
              </Btn>
            </div>
          </div>
          <div
            v-if="!(tareasPorEstado[col.estado] || []).length"
            class="p-3 text-center text-xs text-zinc-600 dark:text-zinc-400"
          >
            Arrastra tareas aquí
          </div>
        </div>
      </div>
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
              <option value="detenida">Detenida</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select v-model="form.prioridad" class="w-full">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
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

const ESTADOS = [
  "pendiente",
  "en_progreso",
  "detenida",
  "completada",
  "cancelada",
];
const TITULOS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  detenida: "Detenida",
  completada: "Completada",
  cancelada: "Cancelada",
};
const COLOR_COLUMNA = {
  pendiente: "bg-amber-50 dark:bg-amber-900/15",
  en_progreso: "bg-blue-50 dark:bg-blue-900/15",
  detenida: "bg-red-50 dark:bg-red-900/15",
  completada: "bg-green-50 dark:bg-green-900/15",
  cancelada: "bg-zinc-100 dark:bg-zinc-800",
};
const COLOR_TEXTO = {
  pendiente: "text-amber-700 dark:text-amber-300",
  en_progreso: "text-blue-700 dark:text-blue-300",
  detenida: "text-red-700 dark:text-red-300",
  completada: "text-green-700 dark:text-green-300",
  cancelada: "text-zinc-500 dark:text-zinc-400",
};
const COLOR_BADGE = {
  pendiente: "amber",
  en_progreso: "blue",
  detenida: "red",
  completada: "green",
  cancelada: "zinc",
};

const tareas = ref([]);
const cargando = ref(true);
const contactos = ref([]);
const empresas = ref([]);
const oportunidades = ref([]);
const showModal = ref(false);
const editing = ref(null);
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
const dropTarget = ref(null);

const columnas = computed(() =>
  ESTADOS.filter((e) => e !== "cancelada").map((e) => ({
    estado: e,
    titulo: TITULOS[e],
  })),
);
const tareasPorEstado = computed(() => {
  const g = {};
  ESTADOS.forEach((e) => {
    g[e] = [];
  });
  tareas.value.forEach((t) => {
    if (t.estado === "cancelada") return;
    if (g[t.estado]) g[t.estado].push(t);
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
  urgente: "red",
  alta: "orange",
  media: "yellow",
  baja: "green",
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
    const { data } = await axios.get("/api/tareas", { params });
    const nombres = {};
    [...contactos.value, ...empresas.value, ...oportunidades.value].forEach(
      (r) => {
        nombres[r.id] = r.nombre;
      },
    );
    const todas = (data.data || []).map((t) => ({
      ...t,
      _vinculo: t.entityId ? nombres[t.entityId] || "" : "",
    }));
    tareas.value = todas.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt),
    );
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar tareas");
  } finally {
    cargando.value = false;
  }
};

const bloqueada = (t) => t.estado === "completada";

const onDragStart = (t, event) => {
  if (bloqueada(t)) return;
  arrastrando.value = t;
  dropTarget.value = null;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(t.id));
  }
};
const onDragEnd = () => {
  arrastrando.value = null;
  dropTarget.value = null;
};

const onDragOver = (estado) => {
  if (arrastrando.value) dropTarget.value = estado;
};

const onDragLeave = (estado) => {
  if (dropTarget.value === estado) dropTarget.value = null;
};

const onDrop = async (estado) => {
  const t = arrastrando.value;
  arrastrando.value = null;
  dropTarget.value = null;
  if (!t || !t.id || t.estado === estado || bloqueada(t)) return;
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
  } catch (e) {
    console.error(e);
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
