<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model="q"
        @input="fetchNegocios"
        type="text"
        placeholder="Buscar negocio..."
        class="flex-1 min-w-[200px]"
      />
      <Select v-model="stageId" @change="fetchNegocios">
        <option value="">Todas las etapas</option>
        <option v-for="s in stages" :key="s.id" :value="s.id">
          {{ s.nombre }}
        </option>
      </Select>
      <Select v-model="alcance" @change="fetchNegocios">
        <option value="">Todos</option>
        <option value="mio">Míos</option>
        <option value="equipo">Mi equipo</option>
      </Select>
      <Btn href="/api/oportunidades/export" variant="outline">Exportar CSV</Btn>
    </div>

    <Card class="overflow-hidden">
      <Table :cols="['35%', '15%', '15%', '15%', '10%', '10%']">
        <template #head>
          <tr>
            <Th>Negocio</Th>
            <Th>Etapa</Th>
            <Th align="right">Importe</Th>
            <Th align="right">Probabilidad</Th>
            <Th></Th>
            <Th></Th>
          </tr>
        </template>
        <tr
          v-for="o in negocios"
          :key="o.id"
          class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
        >
          <Td primary>{{ o.nombre }}</Td>
          <td class="px-6 py-4">
            <Select
              :modelValue="o.stageId"
              @change="cambiarEtapa(o, $event.target.value)"
              size="sm"
            >
              <option v-for="s in stages" :key="s.id" :value="s.id">
                {{ s.nombre }}
              </option>
            </Select>
          </td>
          <Td align="right" tone="strong" class="tabular-nums">{{
            formatCurrency(o.importe)
          }}</Td>
          <Td align="right" tone="strong" class="tabular-nums"
            >{{ o.probabilidad ?? 50 }}%</Td
          >
          <td class="px-6 py-4 text-sm">
            <Btn variant="link" @click="abrirEdicion(o)">Editar</Btn>
          </td>
          <td class="px-6 py-4 text-right text-sm">
            <Btn variant="link-danger" @click="eliminar(o)">Eliminar</Btn>
          </td>
        </tr>
        <TableState
          v-if="cargando && !negocios.length"
          :colspan="6"
          loading
        />
        <TableState v-if="!cargando && !negocios.length" :colspan="6"
          >Sin negocios. Créalos desde el
          <Btn variant="link" to="/pipeline">Pipeline</Btn>.</TableState
        >
      </Table>
    </Card>

    <Modal :open="showModal" @close="showModal = false">
      <template #title>
        <h2 class="text-xl font-bold mb-4">Editar Negocio</h2>
      </template>
      <form @submit.prevent="guardarEdicion" class="space-y-4">
        <Field label="Nombre">
          <Input v-model="form.nombre" type="text" required class="w-full" />
        </Field>
        <Field label="Etapa">
          <Select v-model="form.stageId" required class="w-full">
            <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </Select>
        </Field>
        <Field label="Importe">
          <input v-model.number="form.importe" type="number" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </Field>
        <Field label="Probabilidad (%)">
          <input v-model.number="form.probabilidad" type="number" min="0" max="100" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </Field>
        <Field label="Descripción">
          <Input v-model="form.descripcion" multiline :rows="3" class="w-full" />
        </Field>
        <div class="flex gap-2 pt-2">
          <Btn type="button" variant="ghost" class="flex-1" @click="showModal = false">Cancelar</Btn>
          <Btn type="submit" variant="primary" class="flex-1">Guardar</Btn>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Btn from "../components/Btn.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import TableState from "../components/TableState.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";

const negocios = ref([]);
const stages = ref([]);
const q = ref("");
const stageId = ref("");
const alcance = ref("");
const cargando = ref(true);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ nombre: "", stageId: "", importe: 0, probabilidad: 50, descripcion: "" });

const fetchNegocios = async () => {
  cargando.value = true;
  try {
    const params = { limit: 100 };
    if (q.value) params.q = q.value;
    if (stageId.value) params.stageId = stageId.value;
    if (alcance.value) params.alcance = alcance.value;
    const { data } = await axios.get("/api/oportunidades", { params });
    negocios.value = data.data || [];
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar negocios");
  } finally {
    cargando.value = false;
  }
};

const cambiarEtapa = async (o, stage) => {
  try {
    await axios.put(`/api/oportunidades/${o.id}`, { stageId: stage });
    await fetchNegocios();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error cambiando etapa");
  }
};

const eliminar = async (o) => {
  if (!(await confirmar(`¿Eliminar "${o.nombre}"?`))) return;
  try {
    await axios.delete(`/api/oportunidades/${o.id}`);
    await fetchNegocios();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al eliminar");
  }
};

const abrirEdicion = (o) => {
  editing.value = o;
  form.value = {
    nombre: o.nombre || "",
    stageId: o.stageId || "",
    importe: o.importe || 0,
    probabilidad: o.probabilidad ?? 50,
    descripcion: o.descripcion || "",
  };
  showModal.value = true;
};

const guardarEdicion = async () => {
  try {
    await axios.put(`/api/oportunidades/${editing.value.id}`, form.value);
    showModal.value = false;
    editing.value = null;
    await fetchNegocios();
    toast.success("Negocio actualizado");
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al guardar");
  }
};

onMounted(async () => {
  await loadCurrency();
  try {
    const { data } = await axios.get("/api/pipeline-stages");
    stages.value = data.data || data;
  } catch {
    /* */
  }
  await fetchNegocios();
});
</script>
