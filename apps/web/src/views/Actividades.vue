<template>
  <div class="p-6">
    <div class="panel-flat overflow-hidden">
      <div
        class="p-4 border-b border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-4"
      >
        <Select v-model="filtroTipo" @change="resetAndFetch">
          <option value="">Todos los tipos</option>
          <option value="email_sent">Email enviado</option>
          <option value="task_created">Tarea creada</option>
          <option value="notification">Notificación</option>
          <option value="stage_changed">Cambio de etapa</option>
        </Select>
        <Select v-model="filtroEntidad" @change="resetAndFetch">
          <option value="">Todas las entidades</option>
          <option value="oportunidad">Oportunidad</option>
          <option value="contacto">Contacto</option>
          <option value="campana">Campaña</option>
        </Select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-700/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Fecha
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Tipo
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Título
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Entidad
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Usuario
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <tr
              v-for="act in actividades"
              :key="act.id"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400"
              >
                {{ formatDate(act.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getTipoClass(act.tipo)"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  >{{ act.tipo }}</span
                >
              </td>
              <td
                class="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {{ act.titulo }}
              </td>
              <td class="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                {{ act.entityType }}:{{ act.entityId?.slice(0, 8) }}
              </td>
              <td class="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                {{ act.userId?.slice(0, 8) || "Sistema" }}
              </td>
            </tr>
        <TableState
          v-if="cargando && !actividades.length"
          :colspan="5"
          loading
        />
        <TableState
          v-if="!cargando && actividades.length === 0"
          :colspan="5"
        >
          No hay actividades registradas
        </TableState>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="totalPages > 1"
        :page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :page-size="pageSize"
        item-label="actividades"
        @prev="prevPage"
        @next="nextPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import Select from "../components/Select.vue";
import Pagination from "../components/Pagination.vue";

const actividades = ref([]);
const cargando = ref(false);
const filtroTipo = ref("");
const filtroEntidad = ref("");

// Pagination
const currentPage = ref(1);
const pageSize = 50;
const total = ref(0);
const totalPages = ref(1);

const fetchActividades = async () => {
  cargando.value = true;
  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: ((currentPage.value - 1) * pageSize).toString(),
    });
    if (filtroTipo.value) params.append("tipo", filtroTipo.value);
    if (filtroEntidad.value) params.append("entityType", filtroEntidad.value);
    const response = await axios.get(`/api/activities?${params}`);
    actividades.value = response.data.data || response.data;
    total.value = response.data.total || actividades.value.length;
    totalPages.value = Math.ceil(total.value / pageSize);
  } catch (e) {
    console.error("Error fetching actividades:", e);
    toast.error("Error al cargar actividades");
  } finally {
    cargando.value = false;
  }
};

const resetAndFetch = () => {
  currentPage.value = 1;
  fetchActividades();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchActividades();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchActividades();
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTipoClass = (tipo) => {
  const classes = {
    email_sent:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    task_created:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    notification:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    stage_changed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return `px-2 py-1 rounded-full text-xs font-medium ${classes[tipo] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"}`;
};

onMounted(() => {
  fetchActividades();
});
</script>
