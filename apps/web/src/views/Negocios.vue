<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 min-w-[300px]"
      >
        <Icon name="chart-column" class="h-4 w-4 text-zinc-400" />
        <Input
          v-model="q"
          @input="fetchNegocios"
          type="text"
          placeholder="Buscar negocio..."
          class="border-0 bg-transparent focus:ring-0 p-0"
        />
      </div>
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
        <Btn href="/api/oportunidades/export" variant="icon" title="Exportar CSV" aria-label="Exportar CSV">
          <Icon name="download" class="h-4 w-4" />
        </Btn>
        <Btn @click="abrirCreacion" variant="primary">
          + Nuevo Negocio
        </Btn>
    </div>

    <Card class="overflow-hidden">
      <Table :cols="['30%', '20%', '15%', '15%', '10%', '10%']">
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
          <Td primary>
            {{ o.nombre }}
            <Badge
              v-if="o.completadoEn"
              color="green"
              variant="pill"
              :dot="false"
              class="ml-2 align-middle"
              >Completado</Badge
            >
          </Td>
          <td class="px-6 py-4">
            <Select
              :modelValue="o.stageId"
              :hex="stageHex(o.stageId)"
              :disabled="!!o.completadoEn"
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
          <td class="px-6 py-4 text-right whitespace-nowrap">
            <Btn
              v-if="!o.completadoEn"
              variant="icon"
              :title="esGanado(o) ? 'Cerrar como ganado' : 'Cerrar negocio'"
              :class="esGanado(o) ? 'text-green-600' : 'text-blue-600'"
              @click="abrirCierre(o)"
            >
              <Icon :name="esGanado(o) ? 'completar' : 'pipeline'" class="h-4 w-4" />
            </Btn>
            <Btn
              v-if="o.completadoEn"
              variant="ghost"
              title="Reabrir"
              aria-label="Reabrir"
              @click="reabrir(o)"
            >
              <Icon name="reabrir" class="h-4 w-4" />
            </Btn>
            <Btn
              variant="ghost"
              title="Editar"
              aria-label="Editar"
              @click="abrirEdicion(o)"
            >
              <Icon name="editar" class="h-4 w-4" />
            </Btn>
          </td>
          <td class="px-6 py-4 text-right whitespace-nowrap">
            <Btn
              variant="ghost"
              class="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Eliminar"
              aria-label="Eliminar"
              @click="eliminar(o)"
            >
              <Icon name="eliminar" class="h-4 w-4" />
            </Btn>
          </td>
        </tr>
        <TableState v-if="cargando && !negocios.length" :colspan="6" loading />
        <TableState v-if="!cargando && !negocios.length" :colspan="6">
          <EmptyState icon="negocios">
            Sin negocios. Créalos desde el
            <Btn variant="link" to="/pipeline">Pipeline</Btn>.
          </EmptyState>
        </TableState>
      </Table>
    </Card>

    <Modal :open="showModal" @close="showModal = false">
      <template #title>
        <h2 class="text-xl font-bold mb-4">{{ editing ? "Editar Negocio" : "Nuevo Negocio" }}</h2>
      </template>
      <form @submit.prevent="guardarEdicion" class="space-y-4">
        <Field label="Nombre">
          <Input v-model="form.nombre" type="text" required class="w-full" />
        </Field>
        <Field v-if="!editing" label="Pipeline">
          <Select
            v-model="form.pipelineId"
            required
            class="w-full"
          >
            <option v-for="p in pipelines" :key="p.id" :value="p.id">
              {{ p.nombre }}
            </option>
          </Select>
        </Field>
        <Field label="Etapa">
          <Select
            v-model="form.stageId"
            :hex="stageHex(form.stageId)"
            :disabled="!!editing?.completadoEn"
            required
            class="w-full"
          >
            <option v-for="s in stages" :key="s.id" :value="s.id">
              {{ s.nombre }}
            </option>
          </Select>
        </Field>
        <Field label="Importe">
          <input
            v-model.number="form.importe"
            type="number"
            min="0"
            step="any"
            class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
          />
        </Field>
        <Field label="Probabilidad (%)">
          <input
            v-model.number="form.probabilidad"
            type="number"
            min="0"
            max="100"
            class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
          />
        </Field>
        <Field label="Descripción">
          <Input
            v-model="form.descripcion"
            multiline
            :rows="3"
            class="w-full"
          />
        </Field>
        <div class="flex gap-2 pt-2">
          <Btn
            type="button"
            variant="ghost"
            class="flex-1"
            @click="showModal = false"
            >Cancelar</Btn
          >
          <Btn type="submit" variant="primary" class="flex-1">Guardar</Btn>
        </div>
      </form>
    </Modal>

    <!-- Modal Cierre Negocio (Ganado/Perdido) -->
    <Modal :open="showCloseModal" @close="showCloseModal = false" max-width="max-w-md">
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ closeTipo === "ganado" ? "Cerrar como Ganado" : "Cerrar como Perdido" }}
        </h2>
      </template>
      <form @submit.prevent="cerrarNegocio" class="space-y-4">
<Field :label="closeTipo === 'ganado' ? 'Motivo de ganancia (obligatorio)' : 'Motivo de p�rdida (obligatorio)'">
            <Input
              v-model="closeForm.motivo"
              type="text"
              required
              class="w-full"
              :placeholder="closeTipo === 'ganado' ? 'Ej: Cliente firm� contrato, mejor oferta, etc.' : 'Ej: Cliente eligi� competencia, presupuesto, etc.'"
            />
        </Field>
        <Field label="Probabilidad final">
          <input
            v-model.number="closeForm.probabilidad"
            type="number"
            min="0"
            max="100"
            :disabled="true"
            class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800"
          />
        </Field>
<Field label="Importe final (opcional)">
            <input
              v-model.number="closeForm.importe"
              type="number"
              min="0"
              step="any"
            class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
          />
        </Field>
        <div class="flex gap-2 pt-2">
          <Btn
            type="button"
            variant="ghost"
            class="flex-1"
            @click="showCloseModal = false"
            >Cancelar</Btn
          >
          <Btn
            type="submit"
            :variant="closeTipo === 'ganado' ? 'primary' : 'danger'"
            :class="closeTipo === 'ganado' ? '' : 'flex-1'"
            class="flex-1"
            :disabled="savingClose"
            :loading="savingClose"
            >{{ savingClose ? "Guardando..." : closeTipo === "ganado" ? "Cerrar Ganado" : "Cerrar Perdido" }}</Btn
          >
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Btn from "../components/Btn.vue";
import Icon from "../components/Icon.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import TableState from "../components/TableState.vue";
import Modal from "../components/Modal.vue";
import EmptyState from "../components/EmptyState.vue";
import Field from "../components/Field.vue";

const negocios = ref([]);
const stages = ref([]);
const q = ref("");
const stageId = ref("");
const alcance = ref("");
const cargando = ref(true);
const showModal = ref(false);
const editing = ref(null);
const pipelines = ref([]);
const route = useRoute();
const form = ref({
  nombre: "",
  pipelineId: "",
  stageId: "",
  importe: 0,
  probabilidad: 50,
  descripcion: "",
});

const showCloseModal = ref(false);
const savingClose = ref(false);
const closeTipo = ref("ganado");
const closing = ref(null);
const closeForm = ref({
  motivo: "",
  probabilidad: 100,
  importe: null,
});

const stageHex = (stageId) =>
  stages.value.find((s) => s.id === stageId)?.color || "";

const normNombre = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const esGanado = (o) => {
  const st = stages.value.find((s) => s.id === o.stageId);
  return ["ganado", "won", "closed"].includes(normNombre(st?.nombre));
};

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
    const body = { stageId: stage };
    const st = stages.value.find((s) => s.id === stage);
    const fueraGanado = !["ganado", "won", "closed"].includes(
      normNombre(st?.nombre),
    );
    if (fueraGanado && o.completadoEn) body.completadoEn = null;
    await axios.put(`/api/oportunidades/${o.id}`, body);
    await fetchNegocios();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error cambiando etapa");
  }
};

const completar = async (o) => {
  if (
    !(await confirmar(`¿Completar "${o.nombre}"?`, {
      detalle: "Se marcará como completado (post-venta).",
      peligro: false,
    }))
  )
    return;
  try {
    await axios.put(`/api/oportunidades/${o.id}`, {
      completadoEn: new Date().toISOString(),
    });
    await fetchNegocios();
    toast.exito("Negocio completado");
  } catch (e) {
    toast.error(e.response?.data?.error || "Error al completar");
  }
};

const reabrir = async (o) => {
  if (
    !(await confirmar(`¿Reabrir "${o.nombre}"?`, {
      detalle: "Se limpiará la marca de completado.",
      peligro: true,
    }))
  )
    return;
  try {
    await axios.put(`/api/oportunidades/${o.id}`, { completadoEn: null });
    await fetchNegocios();
    toast.exito("Negocio reabierto");
  } catch (e) {
    toast.error(e.response?.data?.error || "Error al reabrir");
  }
};

const abrirCierre = (o) => {
  const st = stages.value.find((s) => s.id === o.stageId);
  const esGan = ["ganado", "won", "closed"].includes(
    (st?.nombre || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
  );
  closeTipo.value = esGan ? "ganado" : "perdido";
  closing.value = o;
  closeForm.value = {
    motivo: "",
    probabilidad: esGan ? 100 : 0,
    importe: o.importe || null,
  };
  showCloseModal.value = true;
};

const cerrarNegocio = async () => {
  if (!closeForm.value.motivo.trim()) {
    toast.error("El motivo es obligatorio");
    return;
  }
  if (!closing.value) return;
  savingClose.value = true;
  try {
    const body = {
      estadoCierre: closeTipo.value,
      motivoGanado: closeTipo.value === "ganado" ? closeForm.value.motivo : null,
      motivoPerdido: closeTipo.value === "perdido" ? closeForm.value.motivo : null,
      probabilidad: closeForm.value.probabilidad,
      importe: closeForm.value.importe ?? closing.value.importe,
      completadoEn: new Date().toISOString(),
    };
    await axios.put(`/api/oportunidades/${closing.value.id}`, body);
    showCloseModal.value = false;
    closing.value = null;
    closeForm.value.motivo = "";
    await fetchNegocios();
    toast.exito(closeTipo.value === "ganado" ? "Negocio ganado" : "Negocio perdido");
  } catch (e) {
    toast.error(e.response?.data?.error || "Error al cerrar");
  } finally {
    savingClose.value = false;
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
    pipelineId: o.pipelineId || "",
    stageId: o.stageId || "",
    importe: o.importe || 0,
    probabilidad: o.probabilidad ?? 50,
    descripcion: o.descripcion || "",
  };
  showModal.value = true;
};

const abrirCreacion = () => {
  editing.value = null;
  const pipeId = pipelines.value[0]?.id || "";
  const firstStage = stages.value.find((s) => !pipeId || s.pipelineId === pipeId) || stages.value[0];
  form.value = {
    nombre: "",
    pipelineId: pipeId,
    stageId: firstStage?.id || "",
    importe: 0,
    probabilidad: 50,
    descripcion: "",
  };
  showModal.value = true;
};

const guardarEdicion = async () => {
  try {
    if (editing.value) {
      await axios.put(`/api/oportunidades/${editing.value.id}`, form.value);
      toast.exito("Negocio actualizado");
    } else {
      await axios.post("/api/oportunidades", form.value);
      toast.exito("Negocio creado");
    }
    showModal.value = false;
    editing.value = null;
    await fetchNegocios();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al guardar");
  }
};

onMounted(async () => {
  await loadCurrency();
  try {
    const { data } = await axios.get("/api/pipelines");
    pipelines.value = data.data || data;
  } catch {
    /* */
  }
  try {
    const { data } = await axios.get("/api/pipeline-stages");
    stages.value = data.data || data;
  } catch {
    /* */
  }
  await fetchNegocios();
  if (route.path === "/negocios/crear") abrirCreacion();
});
</script>
