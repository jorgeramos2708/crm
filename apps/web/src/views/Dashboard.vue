<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <main class="max-w-7xl mx-auto px-4 py-6">
      <h2 class="text-3xl font-bold tracking-tight mb-6">
        Bienvenido, {{ authStore.user?.name || "Usuario" }}
      </h2>

      <!-- Valor total del pipeline -->
      <div class="mb-6 p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <p class="text-sm font-medium text-zinc-500 mb-1">Valor total del pipeline</p>
        <p class="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{{ formatCurrency(stats.valorTotal) }}</p>
      </div>

      <!-- Tareas pendientes + Actividad reciente -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Tareas pendientes -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Próximas tareas
          </h2>
          <div v-if="loadingTareas" class="py-2">
            <Skeleton :filas="3" />
          </div>
          <div
            v-else-if="tareas.length === 0"
            class="text-center py-8 text-zinc-500"
          >
            No hay tareas pendientes.
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="t in tareas"
              :key="t.id"
              to="/tareas"
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer block"
              :class="bgPrioridad(t.prioridad)"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-lg">{{ iconPrioridad(t.prioridad) }}</span>
                <div class="min-w-0">
                  <p class="font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ t.titulo }}</p>
                  <p v-if="t.vencimiento" class="text-xs text-zinc-500">
                    {{ formatVencimiento(t.vencimiento) }}
                  </p>
                </div>
              </div>
              <Badge
                :color="badgePrioridad(t.prioridad)"
                variant="pill"
                class="flex-shrink-0 ml-2"
              >
                {{ t.prioridad }}
              </Badge>
            </router-link>
          </div>
        </Card>

        <!-- Actividad reciente -->
        <Card class="p-6">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Actividad reciente
          </h2>
          <div v-if="loadingActividad" class="py-2">
            <Skeleton :filas="3" />
          </div>
          <div
            v-else-if="actividades.length === 0"
            class="text-center py-8 text-zinc-500"
          >
            No hay actividad reciente.
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="a in actividades"
              :key="a.id"
              :to="entityRoute(a.entityType)"
              class="flex items-start gap-3 p-2 rounded-lg cursor-pointer block hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <span class="text-lg mt-0.5 flex-shrink-0">{{ iconActividad(a.tipo) }}</span>
              <div class="min-w-0">
                <p class="text-sm text-zinc-900 dark:text-zinc-100">
                  <span class="font-medium">{{ a.titulo }}</span>
                </p>
                <p class="text-xs text-zinc-500">
                  {{ a.entityType }} · {{ tiempoRelativo(a.createdAt) }}
                </p>
              </div>
            </router-link>
          </div>
        </Card>
      </div>

      <!-- Eventos del calendario -->
      <div class="mb-6">
        <Card class="p-6">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Eventos próximos
          </h2>
          <div v-if="loadingCalendario" class="py-2">
            <Skeleton :filas="2" />
          </div>
          <div
            v-else-if="errorCalendario"
            class="text-center py-6 text-zinc-500"
          >
            <p class="mb-1">📅 Calendario no conectado</p>
            <p class="text-xs">Conecta Outlook o Google en Correos para ver eventos.</p>
          </div>
          <div
            v-else-if="eventos.length === 0"
            class="text-center py-6 text-zinc-500"
          >
            No hay eventos próximos esta semana.
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <component
              v-for="(ev, i) in eventos"
              :key="i"
              :is="ev.webLink || ev.htmlLink ? 'a' : 'div'"
              :href="ev.webLink || ev.htmlLink || undefined"
              :target="(ev.webLink || ev.htmlLink) ? '_blank' : undefined"
              class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-700 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors block"
            >
              <p class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{{ ev.subject || ev.title }}</p>
              <p class="text-xs text-zinc-500 mt-1">
                {{ formatFechaEvento(ev.start) }}
              </p>
            </component>
          </div>
        </Card>
      </div>

      <!-- Oportunidades por etapa -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Oportunidades por etapa
        </h2>
        <div class="grid grid-cols-5 gap-4">
          <router-link
            v-for="stage in pipelineStages"
            :key="stage.id"
            to="/pipeline"
            class="stage-card flex flex-col items-center justify-center p-6 rounded-2xl text-white min-h-[140px] cursor-pointer"
            :style="{ backgroundColor: stage.color || '#3b82f6' }"
          >
            <span class="text-4xl font-bold">{{ conteoPorEtapa[stage.id] || 0 }}</span>
            <span class="text-base font-medium opacity-90 mt-2">{{
              stage.nombre
            }}</span>
          </router-link>
        </div>
      </div>

      <!-- Oportunidades recientes -->
      <Card class="p-6">
        <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Oportunidades recientes
        </h2>
        <div v-if="loading && !oportunidades.length" class="py-2">
          <Skeleton :filas="3" />
        </div>
        <div
          v-if="!loading && oportunidades.length === 0"
          class="text-center py-8 text-zinc-500"
        >
          No hay oportunidades aún.
          <Btn to="/pipeline" variant="link">Crea la primera</Btn>
        </div>
        <div class="space-y-3" v-else>
          <div
            v-for="opp in recientes"
            :key="opp.id"
            class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
          >
            <div>
              <p class="font-medium text-zinc-900 dark:text-zinc-100">
                {{ opp.nombre }}
              </p>
              <p class="text-sm text-zinc-500">
                <Badge :hex="colorEtapa(opp.stageId)">{{
                  nombreEtapa(opp.stageId)
                }}</Badge>
              </p>
            </div>
            <span class="text-lg font-bold text-zinc-900 dark:text-zinc-100">{{
              formatCurrency(opp.importe)
            }}</span>
          </div>
        </div>
      </Card>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import { toast } from "../utils/toast";
import Skeleton from "../components/Skeleton.vue";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";

const authStore = useAuthStore();

const stats = ref({ totalOportunidades: 0, valorTotal: 0, totalEtapas: 0, totalUsuarios: 0 });
const oportunidades = ref([]);
const pipelineStages = ref([]);
const loading = ref(true);

const tareas = ref([]);
const loadingTareas = ref(true);

const actividades = ref([]);
const loadingActividad = ref(true);

const eventos = ref([]);
const loadingCalendario = ref(true);
const errorCalendario = ref(false);

const conteoPorEtapa = computed(() => {
  const map = {};
  for (const o of oportunidades.value) {
    map[o.stageId] = (map[o.stageId] || 0) + 1;
  }
  return map;
});

const recientes = computed(() => oportunidades.value.slice(0, 5));

const nombreEtapa = (stageId) => {
  const s = pipelineStages.value.find((x) => x.id === stageId);
  return s ? s.nombre : "Sin etapa";
};

const colorEtapa = (stageId) => {
  const s = pipelineStages.value.find((x) => x.id === stageId);
  return s?.color || "#3b82f6";
};

const iconPrioridad = (p) => {
  const map = { urgente: '🔴', alta: '🟠', media: '🟡', baja: '🟢' };
  return map[p] || '⚪';
};

const bgPrioridad = (p) => {
  const map = {
    urgente: 'bg-red-50 dark:bg-red-900/20',
    alta: 'bg-orange-50 dark:bg-orange-900/20',
    media: 'bg-yellow-50 dark:bg-yellow-900/20',
    baja: 'bg-green-50 dark:bg-green-900/20',
  };
  return map[p] || 'bg-zinc-50 dark:bg-zinc-700';
};

const badgePrioridad = (p) => {
  const map = { urgente: 'red', alta: 'orange', media: 'yellow', baja: 'green' };
  return map[p] || 'zinc';
};

const entityRoute = (type) => {
  const map = { oportunidad: '/negocios', contacto: '/contactos', empresa: '/empresas', campana: '/campañas' };
  return map[type] || '/';
};

const iconActividad = (tipo) => {
  const map = {
    email_sent: '✉️',
    email_opened: '👁️',
    email_clicked: '🔗',
    stage_changed: '🔄',
    task_created: '📋',
    notification: '🔔',
    oportunidad_created: '💼',
    oportunidad_won: '🎉',
    oportunidad_lost: '❌',
  };
  return map[tipo] || '📌';
};

const formatVencimiento = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const hoy = new Date();
  const diff = Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Venció hace ${Math.abs(diff)} día(s)`;
  if (diff === 0) return 'Vence hoy';
  if (diff === 1) return 'Vence mañana';
  return `Vence en ${diff} días`;
};

const tiempoRelativo = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  return `hace ${dias}d`;
};

const formatFechaEvento = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const fetchDashboard = async () => {
  try {
    const [statsRes, oppsRes, stagesRes] = await Promise.all([
      axios.get("/api/dashboard/stats"),
      axios.get("/api/oportunidades?limit=200"),
      axios.get("/api/pipeline-stages"),
    ]);
    stats.value = statsRes.data;
    oportunidades.value = oppsRes.data.data || oppsRes.data;
    pipelineStages.value = stagesRes.data.data || stagesRes.data;
  } catch (e) {
    console.error("Error fetching dashboard:", e);
    toast.error("Error al cargar el resumen");
  } finally {
    loading.value = false;
  }
};

const fetchTareas = async () => {
  try {
    const res = await axios.get("/api/tareas?estado=pendiente&limit=5");
    tareas.value = res.data.data || [];
  } catch (e) {
    console.error("Error fetching tareas:", e);
  } finally {
    loadingTareas.value = false;
  }
};

const fetchActividad = async () => {
  try {
    const res = await axios.get("/api/activities?limit=5");
    actividades.value = res.data.data || [];
  } catch (e) {
    console.error("Error fetching actividad:", e);
  } finally {
    loadingActividad.value = false;
  }
};

const fetchCalendario = async () => {
  try {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await axios.get("/api/calendario", { params: { start, end } });
    eventos.value = res.data.data || [];
    errorCalendario.value = false;
  } catch (e) {
    console.error("Error fetching calendario:", e);
    errorCalendario.value = true;
    eventos.value = [];
  } finally {
    loadingCalendario.value = false;
  }
};

onMounted(async () => {
  await loadCurrency();
  fetchDashboard();
  fetchTareas();
  fetchActividad();
  fetchCalendario();
});
</script>

<style scoped>
.stage-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
}
.stage-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.15);
}
@media (prefers-reduced-motion: reduce) {
  .stage-card { transition: none !important; }
}
</style>
