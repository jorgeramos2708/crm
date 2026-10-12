<template>
  <div class="dashboard-page" data-testid="dashboard">
    <div class="dashboard-main">
      <!-- Page Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Resumen de Oportunidades</h1>
            <p class="page-subtitle">Panorama general de tu pipeline comercial y actividad reciente.</p>
          </div>
          <div class="header-actions">
            <Btn variant="outline" size="sm" @click="refreshDashboard" :loading="loading">
              <Icon name="refresh-cw" class="h-4 w-4" /> Actualizar
            </Btn>
            <Btn variant="primary" size="sm" to="/negocios">
              <Icon name="plus" class="h-4 w-4" /> Nueva Oportunidad
            </Btn>
          </div>
        </div>
      </header>

      <!-- KPI Grid -->
      <section class="kpi-section" aria-labelledby="kpi-title">
        <h2 id="kpi-title" class="sr-only">Indicadores Clave</h2>
        <div class="kpi-grid">
          <StatCard
            v-for="(stat, i) in kpiStats"
            :key="stat.key"
            :title="stat.title"
            :value="stat.value"
            :icon="stat.icon"
            :color="stat.color"
            :trend="stat.trend"
            :trendLabel="stat.trendLabel"
            :animate="true"
            :style="{ '--stagger-delay': `${i * 100}ms` }"
            class="animate-stat-enter"
          />
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Pipeline Stages + Recent Opportunities -->
        <div class="dashboard-col-main">
          <!-- Pipeline Stages -->
          <section class="dashboard-card-section" aria-labelledby="pipeline-title">
            <header class="section-header">
              <h2 id="pipeline-title" class="section-title">Pipeline</h2>
              <router-link to="/pipeline" class="section-link" v-if="pipelineStages.length">
                Ver todo <Icon name="chevron-right" class="h-3.5 w-3.5" />
              </router-link>
            </header>
            <div v-if="loading" class="skeleton-container">
              <Skeleton variant="card" :rows="5" />
            </div>
            <div v-else-if="pipelineStages.length === 0" class="empty-state-container">
              <EmptyState
                icon="git-branch"
                title="Pipeline vacío"
                description="No hay etapas configuradas. Crea tu primera etapa en Configuración."
              >
                <template #action>
                  <Btn variant="primary" size="sm" to="/settings/pipeline">
                    Configurar Pipeline
                  </Btn>
                </template>
              </EmptyState>
            </div>
            <div v-else class="pipeline-board">
              <div
                v-for="stage in pipelineStages"
                :key="stage.id"
                class="pipeline-column"
                :style="{ backgroundColor: `color-mix(in srgb, ${stage.color || '#3b82f6'} 8%, #f1f5f9)` }"
              >
                <div class="pipeline-column-head">
                  <span class="pipeline-dot" :style="{ backgroundColor: stage.color || '#3b82f6' }" />
                  <span class="pipeline-column-name">{{ stage.nombre }}</span>
                  <span class="pipeline-column-count">{{ conteoPorEtapa[stage.id] || 0 }}</span>
                </div>
                <div class="pipeline-column-cards">
                  <router-link
                    v-for="opp in (oppsPorEtapa[stage.id] || []).slice(0, 3)"
                    :key="opp.id"
                    :to="`/negocios/${opp.id}`"
                    class="pipeline-mini-card"
                  >
                    <p class="pipeline-mini-title">{{ opp.nombre }}</p>
                    <p class="pipeline-mini-amount">{{ formatCurrency(opp.importe) }}</p>
                    <div class="pipeline-mini-foot">
                      <Badge
                        :variant="badgeVariant(stage.color)"
                        :color="stage.color"
                        size="sm"
                      >
                        {{ stage.nombre }}
                      </Badge>
                      <span v-if="fechaCorta(opp.fechaCierreEstimada)" class="pipeline-mini-date">
                        {{ fechaCorta(opp.fechaCierreEstimada) }}
                      </span>
                    </div>
                  </router-link>
                  <p v-if="!(oppsPorEtapa[stage.id] || []).length" class="pipeline-column-empty">
                    Sin oportunidades
                  </p>
                </div>
                <router-link
                  v-if="(conteoPorEtapa[stage.id] || 0) > 3"
                  to="/pipeline"
                  class="pipeline-column-more"
                >
                  + Ver más ({{ (conteoPorEtapa[stage.id] || 0) - 3 }})
                </router-link>
                <router-link
                  v-else
                  to="/pipeline"
                  class="pipeline-column-more"
                >
                  + Ver más (0)
                </router-link>
              </div>
            </div>
          </section>

          <!-- Recent Opportunities -->
          <section class="dashboard-card-section" aria-labelledby="recent-ops-title">
            <header class="section-header">
              <h2 id="recent-ops-title" class="section-title">Oportunidades Recientes</h2>
              <router-link to="/negocios" class="section-link">
                Ver todas <Icon name="chevron-right" class="h-3.5 w-3.5" />
              </router-link>
            </header>
            <div v-if="loading && !oportunidades.length" class="skeleton-container">
              <Skeleton variant="table" :rows="5" :cols="4" />
            </div>
            <div v-else-if="!loading && oportunidades.length === 0" class="empty-state-container">
              <EmptyState
                icon="briefcase"
                title="Sin oportunidades"
                description="Empieza creando tu primera oportunidad de venta."
              >
                <template #action>
                  <Btn variant="primary" size="sm" to="/negocios/crear">
                    <Icon name="plus" class="h-3.5 w-3.5" /> Nueva Oportunidad
                  </Btn>
                </template>
              </EmptyState>
            </div>
            <div v-else class="opportunities-table-container">
              <Table :cols="[null, '200px', '140px', '120px']">
                <template #head>
                  <tr>
                    <Th class="text-left">Oportunidad</Th>
                    <Th class="text-left hidden md:table-cell">Empresa</Th>
                    <Th class="text-right">Valor</Th>
                    <Th class="text-center">Etapa</Th>
                  </tr>
                </template>
                <tr
                  v-for="opp in recientes"
                  :key="opp.id"
                  class="table-row hover:bg-[var(--bg-subtle)] transition-colors"
                  @click="() => router.push(`/negocios/${opp.id}`)"
                >
                  <Td class="font-medium text-[var(--fg)]">{{ opp.nombre }}</Td>
                  <Td class="text-[var(--fg-muted)] hidden md:table-cell">{{ opp.empresa?.nombre || '—' }}</Td>
                  <Td class="text-right font-semibold tabular-nums text-[var(--fg)]">
                    {{ formatCurrency(opp.importe) }}
                  </Td>
                  <Td class="text-center">
                    <Badge
                      :variant="badgeVariant(opp.stageColor)"
                      :color="opp.stageColor"
                      size="sm"
                    >
                      {{ nombreEtapa(opp.stageId) }}
                    </Badge>
                  </Td>
                </tr>
              </Table>
            </div>
          </section>
        </div>

        <!-- Sidebar Widgets -->
        <aside class="dashboard-col-sidebar" aria-label="Widgets del resumen">
          <!-- Upcoming Tasks -->
          <section class="dashboard-card-section" aria-labelledby="tasks-title">
            <header class="section-header">
              <h2 id="tasks-title" class="section-title">Próximas Tareas</h2>
              <router-link to="/tareas" class="section-link">
                Ver todas <Icon name="chevron-right" class="h-3.5 w-3.5" />
              </router-link>
            </header>
            <div v-if="loadingTareas" class="skeleton-container">
              <Skeleton variant="list" :rows="4" />
            </div>
            <div v-else-if="tareas.length === 0" class="empty-state-container">
              <EmptyState
                icon="check-square"
                compact
                title="Sin tareas pendientes"
                description="¡Todo al día! Disfruta el momento."
              >
                <template #action>
                  <Btn variant="primary" size="sm" to="/tareas?nuevo=1">
                    + Nueva Tarea
                  </Btn>
                </template>
              </EmptyState>
            </div>
            <div v-else class="task-list">
              <router-link
                v-for="t in tareas.slice(0, 5)"
                :key="t.id"
                to="/tareas"
                class="task-item"
                :class="taskPriorityClass(t.prioridad)"
              >
                <div class="task-priority-indicator" :style="{ backgroundColor: priorityColor(t.prioridad) }" />
                <div class="task-content">
                  <p class="task-title">{{ t.titulo }}</p>
                  <p v-if="t.vencimiento" class="task-due" :class="{ 'overdue': isOverdue(t.vencimiento) }">
                    {{ formatVencimiento(t.vencimiento) }}
                  </p>
                </div>
                <Badge
                  :variant="badgeVariant(priorityColor(t.prioridad))"
                  :color="priorityColor(t.prioridad)"
                  size="xs"
                >
                  {{ t.prioridad }}
                </Badge>
              </router-link>
            </div>
          </section>

          <!-- Upcoming Events -->
          <section class="dashboard-card-section" aria-labelledby="events-title">
            <header class="section-header">
              <h2 id="events-title" class="section-title">Próximos Eventos</h2>
              <router-link to="/calendario" class="section-link">
                Ver agenda <Icon name="chevron-right" class="h-3.5 w-3.5" />
              </router-link>
            </header>
            <div v-if="loadingCalendario" class="skeleton-container">
              <Skeleton variant="list" :rows="3" />
            </div>
            <div v-else-if="errorCalendario" class="empty-state-container">
              <EmptyState
                icon="calendar"
                compact
                title="Calendario no conectado"
                description="Conecta tu Google u Outlook en Configuración."
              >
                <template #action>
                  <Btn variant="outline" size="sm" to="/settings">
                    Conectar
                  </Btn>
                </template>
              </EmptyState>
            </div>
            <div v-else-if="eventos.length === 0" class="empty-state-container">
              <EmptyState
                icon="calendar"
                compact
                title="Sin eventos esta semana"
                description="Tu agenda está despejada."
              />
            </div>
            <div v-else class="event-list">
              <router-link
                v-for="(ev, i) in eventos.slice(0, 4)"
                :key="i"
                to="/calendario"
                class="event-item"
              >
                <div class="event-time">
                  <span class="event-day">{{ formatEventDay(ev.start) }}</span>
                  <span class="event-hour">{{ formatEventHour(ev.start) }}</span>
                </div>
                <div class="event-details">
                  <p class="event-title">{{ ev.subject || ev.title }}</p>
                  <p v-if="ev.location" class="event-location">
                    <Icon name="map-pin" class="h-3 w-3 inline" /> {{ ev.location }}
                  </p>
                </div>
              </router-link>
            </div>
          </section>

          <!-- Recent Activity -->
          <section class="dashboard-card-section" aria-labelledby="activity-title">
            <header class="section-header">
              <h2 id="activity-title" class="section-title">Actividad Reciente</h2>
              <router-link to="/actividades" class="section-link">
                Ver todo <Icon name="chevron-right" class="h-3.5 w-3.5" />
              </router-link>
            </header>
            <div v-if="loadingActividad" class="skeleton-container">
              <Skeleton variant="list" :rows="4" />
            </div>
            <div v-else-if="actividades.length === 0" class="empty-state-container">
              <EmptyState
                icon="activity"
                compact
                title="Sin actividad reciente"
                description="La actividad aparecerá aquí automáticamente."
              />
            </div>
            <div v-else class="activity-list">
              <router-link
                v-for="a in actividades.slice(0, 5)"
                :key="a.id"
                :to="entityRoute(a.entityType)"
                class="activity-item"
              >
                <span class="activity-icon" :style="{ backgroundColor: activityColor(a.tipo) }">
                  <Icon :name="activityIcon(a.tipo)" class="h-4 w-4" />
                </span>
                <div class="activity-content">
                  <p class="activity-title">
                    <span class="font-medium">{{ a.titulo }}</span>
                  </p>
                  <p class="activity-meta">
                    {{ activityEntityLabel(a.entityType) }} · {{ tiempoRelativo(a.createdAt) }}
                  </p>
                </div>
              </router-link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { toast } from "../utils/toast";
import Skeleton from "../components/Skeleton.vue";
import EmptyState from "../components/EmptyState.vue";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import StatCard from "../components/StatCard.vue";
import Icon from "../components/Icon.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const stats = ref({
  totalOportunidades: 0,
  valorTotal: 0,
  totalEtapas: 0,
  totalUsuarios: 0,
});
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

const recientes = computed(() => oportunidades.value.slice(0, 10));

const oppsPorEtapa = computed(() => {
  const map = {};
  for (const o of oportunidades.value) {
    const k = o.stageId || 'sin-etapa';
    if (!map[k]) map[k] = [];
    map[k].push(o);
  }
  return map;
});

const fechaCorta = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
};

const importeDe = (o) => Number(o.importe || 0);
const esGanada = (o) => o.estadoCierre === 'ganado';
const esPerdida = (o) => o.estadoCierre === 'perdido';
const valorOportunidades = computed(() => oportunidades.value.reduce((s, o) => s + importeDe(o), 0));
const valorGanadas = computed(() => oportunidades.value.filter(esGanada).reduce((s, o) => s + importeDe(o), 0));
const valorEnProceso = computed(() => oportunidades.value.filter((o) => !esGanada(o) && !esPerdida(o)).reduce((s, o) => s + importeDe(o), 0));
const valorPerdidas = computed(() => oportunidades.value.filter(esPerdida).reduce((s, o) => s + importeDe(o), 0));

const kpiStats = computed(() => [
  {
    key: 'total-pipeline',
    title: 'Total Pipeline',
    value: stats.value.valorTotal || valorOportunidades.value,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.657 0 3 .895 3 2s-1.343 2-3 2-3 .895-3 2-1.343 2-3 2',
    color: 'brand',
    trend: 12,
    trendLabel: 'vs. mes anterior',
  },
  {
    key: 'ganadas',
    title: 'Oportunidades Ganadas',
    value: valorGanadas.value,
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'success',
    trend: 28,
    trendLabel: 'vs. mes anterior',
  },
  {
    key: 'en-proceso',
    title: 'En Proceso',
    value: valorEnProceso.value,
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'warning',
    trend: 6,
    trendLabel: 'vs. mes anterior',
  },
  {
    key: 'perdidas',
    title: 'Perdidas',
    value: valorPerdidas.value,
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'destructive',
    trend: -14,
    trendLabel: 'vs. mes anterior',
  },
]);

const nombreEtapa = (stageId) => {
  const s = pipelineStages.value.find((x) => x.id === stageId);
  return s ? s.nombre : "Sin etapa";
};

const badgeVariant = (color) => {
  const map = {
    '#10b981': 'success',
    '#f59e0b': 'warning',
    '#ef4444': 'destructive',
    '#3b82f6': 'info',
    '#8b5cf6': 'brand',
  };
  return map[color] || 'default';
};

const priorityColor = (p) => {
  const map = {
    urgente: '#ef4444',
    alta: '#f59e0b',
    media: '#3b82f6',
    baja: '#10b981',
  };
  return map[p] || '#64748b';
};

const taskPriorityClass = (p) => {
  const map = {
    urgente: 'task-urgent',
    alta: 'task-high',
    media: 'task-medium',
    baja: 'task-low',
  };
  return map[p] || '';
};

const isOverdue = (fecha) => {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
};

const formatVencimiento = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  const hoy = new Date();
  const diff = Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Venció hace ${Math.abs(diff)} día(s)`;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  return `Vence en ${diff} días`;
};

const entityRoute = (type) => {
  const map = {
    oportunidad: "/negocios",
    contacto: "/contactos",
    empresa: "/empresas",
    campana: "/campañas",
  };
  return map[type] || "/";
};

const activityIcon = (tipo) => {
  const map = {
    email_sent: "send",
    email_opened: "eye",
    email_clicked: "mouse-pointer",
    stage_changed: "git-branch",
    task_created: "plus-circle",
    notification: "bell",
    oportunidad_created: "briefcase",
    oportunidad_won: "trophy",
    oportunidad_lost: "x-circle",
  };
  return map[tipo] || "activity";
};

const activityColor = (tipo) => {
  const map = {
    email_sent: '#3b82f6',
    email_opened: '#10b981',
    email_clicked: '#8b5cf6',
    stage_changed: '#f59e0b',
    task_created: '#3b82f6',
    notification: '#ef4444',
    oportunidad_created: '#10b981',
    oportunidad_won: '#10b981',
    oportunidad_lost: '#ef4444',
  };
  return map[tipo] || '#64748b';
};

const activityEntityLabel = (type) => {
  const map = {
    oportunidad: 'Oportunidad',
    contacto: 'Contacto',
    empresa: 'Empresa',
    campana: 'Campaña',
  };
  return map[type] || 'Sistema';
};

const tiempoRelativo = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  return `hace ${dias}d`;
};

const formatEventDay = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  const hoy = new Date();
  const diff = Math.ceil((d - hoy) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
};

const formatEventHour = (fecha) => {
  if (!fecha) return "";
  const d = new Date(fecha);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};

const fechaHoy = computed(() => {
  const s = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
});

const fetchDashboard = async () => {
  try {
    const [statsRes, oppsRes, stagesRes] = await Promise.all([
      axios.get("/api/dashboard/stats"),
      axios.get("/api/oportunidades?limit=200"),
      axios.get("/api/pipeline-stages"),
    ]);
    stats.value = statsRes.data.data || statsRes.data;
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
    const res = await axios.get("/api/tareas?limit=50");
    const abiertas = (res.data.data || []).filter(
      (t) => t.estado !== "completada" && t.estado !== "cancelada",
    );
    tareas.value = priorizarTareas(abiertas);
  } catch (e) {
    console.error("Error fetching tareas:", e);
  } finally {
    loadingTareas.value = false;
  }
};

const ORDEN_PRIORIDAD = { urgente: 0, alta: 1, media: 2, baja: 3 };

const porVencimiento = (a, b) => {
  if (!a.vencimiento && !b.vencimiento) return 0;
  if (!a.vencimiento) return 1;
  if (!b.vencimiento) return -1;
  return new Date(a.vencimiento) - new Date(b.vencimiento);
};

const priorizarTareas = (lista) => {
  const ordenadas = [...lista].sort((a, b) => {
    const pa = ORDEN_PRIORIDAD[a.prioridad] ?? 9;
    const pb = ORDEN_PRIORIDAD[b.prioridad] ?? 9;
    return pa !== pb ? pa - pb : porVencimiento(a, b);
  });
  const altas = ordenadas.filter(
    (t) => t.prioridad === "urgente" || t.prioridad === "alta",
  );
  if (altas.length) return altas.slice(0, 5);
  const mejor = ordenadas[0]?.prioridad;
  return ordenadas.filter((t) => t.prioridad === mejor).slice(0, 5);
};

const fetchActividad = async () => {
  try {
    const res = await axios.get("/api/activities?limit=10");
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

const refreshDashboard = async () => {
  loading.value = true;
  loadingTareas.value = true;
  loadingActividad.value = true;
  loadingCalendario.value = true;
  await Promise.all([fetchDashboard(), fetchTareas(), fetchActividad(), fetchCalendario()]);
  toast.success("Dashboard actualizado");
};

onMounted(async () => {
  await loadCurrency();
  await Promise.all([fetchDashboard(), fetchTareas(), fetchActividad(), fetchCalendario()]);
});
</script>

<style scoped>
.dashboard-page {
  @apply min-h-screen bg-[var(--bg)];
}

.dashboard-main {
  @apply max-w-7xl mx-auto px-4 py-6;
}

/* Page Header */
.dashboard-header {
  @apply mb-8;
}

.header-content {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4;
}

.page-title {
  @apply text-3xl font-bold text-[var(--fg)] tracking-tight;
}

.page-subtitle {
  @apply text-[var(--fg-muted)] mt-1;
}

.header-actions {
  @apply flex items-center gap-2 flex-wrap;
}

/* KPI Section */
.kpi-section {
  @apply mb-8;
}

.kpi-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

/* Stagger animation for KPIs */
@keyframes stat-enter {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-stat-enter {
  animation: stat-enter var(--duration-normal) var(--ease-spring) both;
}
.animate-stat-enter:nth-child(1) { animation-delay: 0ms; }
.animate-stat-enter:nth-child(2) { animation-delay: 100ms; }
.animate-stat-enter:nth-child(3) { animation-delay: 200ms; }
.animate-stat-enter:nth-child(4) { animation-delay: 300ms; }

@media (prefers-reduced-motion: reduce) {
  .animate-stat-enter {
    animation: none !important;
  }
}

/* Dashboard Grid */
.dashboard-grid {
  @apply grid lg:grid-cols-12 gap-6;
}

.dashboard-col-main {
  @apply lg:col-span-7 space-y-6;
}

.dashboard-col-sidebar {
  @apply lg:col-span-5 space-y-6;
}

/* Section Styles */
.dashboard-card-section {
  @apply bg-[var(--card)] rounded-2xl border;
  border-color: var(--card-border);
  overflow: hidden;
}

.section-header {
  @apply flex items-center justify-between px-6 py-4 border-b;
  border-color: var(--card-border);
}

.section-title {
  @apply text-lg font-semibold text-[var(--fg)];
}

.section-link {
  @apply flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline transition-colors;
}

/* Pipeline Board (estilo referencia: columnas claras + mini-cards blancas) */
.pipeline-board {
  @apply p-4 grid gap-3;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.pipeline-column {
  @apply rounded-xl p-3 flex flex-col gap-2 min-h-[220px];
  border: 1px solid var(--card-border);
}

.pipeline-column-head {
  @apply flex items-center gap-2 px-1;
}

.pipeline-dot {
  @apply w-2 h-2 rounded-full flex-shrink-0;
}

.pipeline-column-name {
  @apply text-[13px] font-semibold truncate flex-1;
  color: var(--fg);
}

.pipeline-column-count {
  @apply text-xs font-bold tabular-nums;
  color: var(--fg-muted);
}

.pipeline-column-cards {
  @apply flex flex-col gap-2 flex-1;
}

.pipeline-mini-card {
  @apply block rounded-xl p-3 bg-white dark:bg-zinc-800 border transition-all duration-150 ease-out;
  border-color: var(--card-border);
  text-decoration: none;
}
.pipeline-mini-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.pipeline-mini-title {
  @apply text-[13px] font-semibold truncate;
  color: var(--fg);
}

.pipeline-mini-amount {
  @apply text-xs mt-0.5 tabular-nums;
  color: var(--fg-muted);
}

.pipeline-mini-foot {
  @apply flex items-center justify-between gap-2 mt-2;
}

.pipeline-mini-date {
  @apply text-[11px] tabular-nums;
  color: var(--fg-subtle);
}

.pipeline-column-empty {
  @apply text-xs text-center py-6;
  color: #475569;
}
html.dark .pipeline-column-empty {
  color: var(--fg-muted);
}

.pipeline-column-more {
  @apply text-xs font-medium px-1 pt-1;
  color: var(--brand);
}
.pipeline-column-more:hover {
  text-decoration: underline;
}

/* Opportunities Table */
.opportunities-table-container {
  @apply overflow-x-auto;
}

.opportunities-table-container table {
  @apply w-full;
}

.table-row {
  @apply cursor-pointer;
}

.table-row:hover {
  @apply bg-[var(--bg-subtle)];
}

/* Task List */
.task-list {
  @apply p-4 space-y-2 max-h-80 overflow-y-auto;
}

.task-item {
  @apply flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--bg-subtle)];
}

.task-priority-indicator {
  @apply w-1 h-full rounded-l-xl flex-shrink-0;
}

.task-content {
  @apply flex-1 min-w-0;
}

.task-title {
  @apply font-medium text-sm text-[var(--fg)] truncate;
}

.task-due {
  @apply text-xs text-[var(--fg-muted)] mt-0.5;
}

.task-due.overdue {
  @apply text-[var(--destructive)] font-medium;
}

.task-urgent .task-title { color: var(--destructive); }
.task-high .task-title { color: var(--warning); }
.task-medium .task-title { color: var(--info); }
.task-low .task-title { color: var(--success); }

/* Event List */
.event-list {
  @apply p-4 space-y-3 max-h-72 overflow-y-auto;
}

.event-item {
  @apply flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors;
  text-decoration: none;
}

.event-time {
  @apply flex flex-col items-center justify-center w-14 flex-shrink-0;
}

.event-day {
  @apply text-xs font-semibold text-[var(--brand)];
}

.event-hour {
  @apply text-xs text-[var(--fg-muted)];
}

.event-details {
  @apply flex-1 min-w-0;
}

.event-title {
  @apply font-medium text-sm text-[var(--fg)] truncate;
}

.event-location {
  @apply text-xs text-[var(--fg-muted)] flex items-center gap-1 mt-0.5;
}

/* Activity List */
.activity-list {
  @apply p-4 space-y-3 max-h-72 overflow-y-auto;
}

.activity-item {
  @apply flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors;
  text-decoration: none;
}

.activity-icon {
  @apply flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 text-white;
}

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-title {
  @apply text-sm text-[var(--fg)] mb-0.5;
}

.activity-meta {
  @apply text-xs text-[var(--fg-muted)];
}

/* Empty State Container */
.empty-state-container {
  @apply p-8;
}

/* Skeleton Container */
.skeleton-container {
  @apply p-6;
}

/* Table Row Animation */
@keyframes table-row-enter {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.table-row-enter-active {
  animation: table-row-enter var(--duration-fast) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .table-row-enter-active {
    animation: none !important;
  }
}
</style>