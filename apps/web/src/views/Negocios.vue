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
      <Table>
        <template #head>
          <tr>
            <Th>Negocio</Th>
            <Th>Etapa</Th>
            <Th align="right">Importe</Th>
            <Th align="right">Prob.</Th>
            <Th align="right">Acciones</Th>
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
          <td class="px-6 py-4 text-right text-sm">
            <Btn variant="link-danger" @click="eliminar(o)">Eliminar</Btn>
          </td>
        </tr>
        <tr v-if="cargando && !negocios.length">
          <td colspan="5">
            <div class="p-4"><Skeleton :filas="5" /></div>
          </td>
        </tr>
        <tr v-if="!cargando && !negocios.length">
          <td colspan="5" class="px-6 py-12 text-center text-sm text-zinc-500">
            Sin negocios. Créalos desde el
            <Btn variant="link" to="/pipeline">Pipeline</Btn>.
          </td>
        </tr>
      </Table>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Skeleton from "../components/Skeleton.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Btn from "../components/Btn.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";

const negocios = ref([]);
const stages = ref([]);
const q = ref("");
const stageId = ref("");
const alcance = ref("");
const cargando = ref(true);

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
