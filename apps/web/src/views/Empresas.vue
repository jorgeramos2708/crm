<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <div class="flex gap-2">
        <Btn href="/api/companies/export" variant="outline">Exportar CSV</Btn>
        <Btn @click="openModal(null)">+ Nueva Empresa</Btn>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Lista -->
      <div class="panel-flat overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <Input
            v-model="q"
            @input="fetchEmpresas"
            type="text"
            placeholder="Buscar por nombre o dominio..."
            class="w-full"
          />
        </div>
        <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
          <li
            v-for="e in empresas"
            :key="e.id"
            @click="seleccionar(e)"
            class="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 cursor-pointer"
            :class="{
              'bg-zinc-100 dark:bg-zinc-700/70': selected?.id === e.id,
            }"
          >
            <div class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ e.nombre }}
            </div>
            <div class="text-sm text-zinc-500">
              {{ e.dominio || "Sin dominio" }}
            </div>
          </li>
          <li v-if="cargando && !empresas.length" class="px-6 py-4">
            <Skeleton :filas="4" />
          </li>
          <li
            v-if="!cargando && empresas.length === 0"
            class="px-6 py-12 text-center text-zinc-500 text-sm"
          >
            No hay empresas.
          </li>
        </ul>
      </div>

      <!-- Detalle -->
      <div class="panel-flat p-6">
        <div v-if="!selected" class="text-zinc-500 text-sm">
          Selecciona una empresa para ver sus contactos.
        </div>
        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold">{{ selected.nombre }}</h2>
              <p class="text-sm text-zinc-500">
                {{ selected.dominio || "Sin dominio" }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                @click="openModal(selected)"
                class="text-blue-600 hover:underline text-sm"
              >
                Editar
              </button>
              <button
                @click="eliminar"
                class="text-red-600 hover:underline text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>

          <h3 class="font-medium text-sm mb-2">
            Contactos vinculados ({{ selected.contactos?.length || 0 }})
          </h3>
          <ul class="divide-y divide-zinc-200 dark:divide-zinc-700 mb-4">
            <li
              v-for="c in selected.contactos || []"
              :key="c.id"
              class="py-2 flex items-center justify-between text-sm"
            >
              <span
                >{{ c.nombre }}
                <span class="text-zinc-500">{{
                  c.email ? `· ${c.email}` : ""
                }}</span></span
              >
              <button
                @click="desvincular(c)"
                class="text-red-600 hover:underline text-xs"
              >
                Quitar
              </button>
            </li>
            <li
              v-if="!selected.contactos?.length"
              class="py-2 text-sm text-zinc-500"
            >
              Sin contactos vinculados.
            </li>
          </ul>

          <div class="flex gap-2">
            <Select v-model="linkId" class="flex-1">
              <option value="">Seleccionar contacto...</option>
              <option v-for="c in contactos" :key="c.id" :value="c.id">
                {{ c.nombre }}{{ c.email ? ` (${c.email})` : "" }}
              </option>
            </Select>
            <Btn @click="vincular" :disabled="!linkId" variant="outline"
              >Vincular</Btn
            >
          </div>

          <h3 class="font-medium text-sm mt-6 mb-2">Archivos</h3>
          <ul class="divide-y divide-zinc-200 dark:divide-zinc-700 mb-2">
            <li
              v-for="a in adjuntos"
              :key="a.id"
              class="py-2 flex items-center justify-between text-sm"
            >
              <span
                >{{ a.nombre }}
                <span class="text-zinc-500 text-xs"
                  >{{ Math.round((a.tamano || 0) / 1024) }} KB</span
                ></span
              >
              <span class="flex gap-2 text-xs">
                <Btn
                  :href="`/api/archivos/${a.id}/download`"
                  target="_blank"
                  variant="link"
                  >Descargar</Btn
                >
                <button
                  @click="borrarArchivo(a)"
                  class="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </span>
            </li>
            <li v-if="!adjuntos.length" class="py-2 text-sm text-zinc-500">
              Sin archivos.
            </li>
          </ul>
          <label
            class="inline-block px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer"
          >
            Subir archivo
            <input type="file" class="hidden" @change="subirArchivo" />
          </label>

          <h3 class="font-medium text-sm mt-6 mb-2">Historial</h3>
          <ul class="space-y-2 max-h-64 overflow-y-auto">
            <li
              v-for="(it, idx) in timeline"
              :key="idx"
              class="text-sm border-l-2 border-zinc-200 dark:border-zinc-700 pl-3"
            >
              <span
                class="inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 mr-1"
                >{{ it.kind }}</span
              >
              <span v-if="it.kind === 'actividad'">{{ it.data.titulo }}</span>
              <span v-else-if="it.kind === 'tarea'"
                >Tarea: {{ it.data.titulo }} ({{ it.data.estado }})</span
              >
              <span v-else>Archivo: {{ it.data.nombre }}</span>
              <div class="text-xs text-zinc-500">
                {{
                  new Date(
                    it.data.created_at || it.data.createdAt,
                  ).toLocaleString()
                }}
              </div>
            </li>
            <li v-if="!timeline.length" class="text-sm text-zinc-500">
              Sin historial.
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editing ? "Editar Empresa" : "Nueva Empresa" }}
        </h2>
        <form @submit.prevent="guardar" class="space-y-4">
          <Field label="Nombre" required>
            <Input v-model="form.nombre" type="text" required class="w-full" />
          </Field>
          <Field label="Dominio">
            <Input
              v-model="form.dominio"
              type="text"
              placeholder="empresa.com"
              class="w-full"
            />
          </Field>
          <CustomFields entidad="empresa" v-model="form.custom" />
          <div class="flex gap-2 pt-2">
            <Btn
              type="button"
              variant="outline"
              class="flex-1"
              @click="showModal = false"
              >Cancelar</Btn
            >
            <Btn
              type="submit"
              class="flex-1"
              :disabled="saving"
              :loading="saving"
              >{{ saving ? "Guardando..." : "Guardar" }}</Btn
            >
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import CustomFields from "../components/CustomFields.vue";
import Skeleton from "../components/Skeleton.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Btn from "../components/Btn.vue";
import Field from "../components/Field.vue";

const empresas = ref([]);
const cargando = ref(true);
const contactos = ref([]);
const selected = ref(null);
const q = ref("");
const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const form = ref({ nombre: "", dominio: "" });
const linkId = ref("");

const fetchEmpresas = async () => {
  cargando.value = true;
  try {
    const { data } = await axios.get("/api/companies", {
      params: { limit: 50, q: q.value || undefined },
    });
    empresas.value = data.data || [];
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar empresas");
  } finally {
    cargando.value = false;
  }
};

const fetchContactos = async () => {
  try {
    const { data } = await axios.get("/api/contactos", {
      params: { limit: 100 },
    });
    contactos.value = data.data || data;
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar contactos");
  }
};
const timeline = ref([]);

const seleccionar = async (e) => {
  try {
    const { data } = await axios.get(`/api/companies/${e.id}`);
    selected.value = data;
    const [adj, tl] = await Promise.all([
      axios.get("/api/archivos", {
        params: { entityType: "empresa", entityId: e.id },
      }),
      axios.get("/api/timeline", {
        params: { entityType: "empresa", entityId: e.id },
      }),
    ]);
    adjuntos.value = adj.data || [];
    timeline.value = tl.data || [];
  } catch (e2) {
    console.error(e2);
    toast.error("Error al cargar el detalle");
  }
};

const subirArchivo = async (ev) => {
  const file = ev.target.files?.[0];
  if (!file || !selected.value) return;
  const form = new FormData();
  form.append("file", file);
  form.append("entityType", "empresa");
  form.append("entityId", selected.value.id);
  try {
    await axios.post("/api/archivos", form);
    await seleccionar(selected.value);
  } catch (e) {
    toast.error(e.response?.data?.error || "Error subiendo archivo");
  } finally {
    ev.target.value = "";
  }
};

const borrarArchivo = async (a) => {
  if (!(await confirmar(`¿Eliminar ${a.nombre}?`))) return;
  try {
    await axios.delete(`/api/archivos/${a.id}`);
    await seleccionar(selected.value);
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al eliminar archivo");
  }
};

const openModal = (e) => {
  editing.value = e;
  form.value = {
    nombre: e?.nombre || "",
    dominio: e?.dominio || "",
    custom: { ...(e?.custom || {}) },
  };
  showModal.value = true;
};

const guardar = async () => {
  saving.value = true;
  try {
    if (editing.value) {
      await axios.put(`/api/companies/${editing.value.id}`, form.value);
    } else {
      await axios.post("/api/companies", form.value);
    }
    showModal.value = false;
    await fetchEmpresas();
    if (selected.value && editing.value) await seleccionar(editing.value);
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al guardar");
  } finally {
    saving.value = false;
  }
};

const eliminar = async () => {
  if (!(await confirmar(`¿Eliminar ${selected.value.nombre}?`))) return;
  try {
    await axios.delete(`/api/companies/${selected.value.id}`);
    selected.value = null;
    await fetchEmpresas();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al eliminar");
  }
};

const vincular = async () => {
  if (!linkId.value || !selected.value) return;
  try {
    await axios.post(`/api/companies/${selected.value.id}/contacts`, {
      contactoId: linkId.value,
    });
    linkId.value = "";
    await seleccionar(selected.value);
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al vincular");
  }
};

const desvincular = async (c) => {
  try {
    await axios.delete(`/api/companies/${selected.value.id}/contacts/${c.id}`);
    await seleccionar(selected.value);
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al desvincular");
  }
};

onMounted(async () => {
  await Promise.all([fetchEmpresas(), fetchContactos()]);
});
</script>
