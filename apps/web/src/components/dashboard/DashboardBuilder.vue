<template>
  <div class="dashboard-builder">
    <!-- Header -->
    <header class="dashboard-builder__header">
      <div class="dashboard-builder__title-section">
        <h1 class="dashboard-builder__title">Dashboard Builder</h1>
        <p class="dashboard-builder__subtitle">Arrastra widgets, configura períodos y guarda tus vistas</p>
      </div>
      <div class="dashboard-builder__actions">
        <DateRangePicker
          v-model="dateRange"
          :presets="datePresets"
        />
        <button
          v-if="editing"
          type="button"
          class="btn btn-ghost btn-sm"
          @click="saveLayout"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Guardar vista
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary btn-sm"
          @click="editing = true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar layout
        </button>
      </div>
    </header>

    <!-- Widget Library Sidebar (when editing) -->
    <aside v-if="editing" class="dashboard-builder__sidebar">
      <div class="dashboard-builder__sidebar-header">
        <h3>Biblioteca de Widgets</h3>
        <button type="button" class="btn btn-ghost btn-sm" @click="editing = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="widget-library">
        <div
          v-for="widget in availableWidgets"
          :key="widget.id"
          class="widget-library__item"
          draggable="true"
          @dragstart="onDragStart(widget)"
        >
          <div class="widget-library__icon" :style="{ backgroundColor: widget.color }">
            <component :is="widget.icon" class="w-5 h-5" />
          </div>
          <div class="widget-library__info">
            <span class="widget-library__name">{{ widget.name }}</span>
            <span class="widget-library__desc">{{ widget.description }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Grid -->
    <main class="dashboard-builder__main" :class="{ 'dashboard-builder__main--editing': editing }">
      <div
        class="dashboard-grid"
        :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }"
        @dragover.prevent="onDragOver"
        @drop="onDrop"
      >
        <!-- Add widget placeholder when editing -->
        <div
          v-if="editing && layout.length === 0"
          class="dashboard-empty"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-12 h-12 text-zinc-400">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p>Arrastra widgets desde la barra lateral para empezar</p>
        </div>

        <!-- Widget Slots -->
        <div
          v-for="(widget, index) in layout"
          :key="widget.id"
          class="dashboard-widget-slot"
          :style="{ gridColumn: widget.spanX ? `span ${widget.spanX}` : '', gridRow: widget.spanY ? `span ${widget.spanY}` : '' }"
        >
          <div class="widget-wrapper" :class="{ 'widget-wrapper--editing': editing }">
            <div v-if="editing" class="widget-toolbar">
              <button
                type="button"
                class="widget-toolbar__btn"
                @click="editWidget(widget)"
                title="Configurar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                class="widget-toolbar__btn"
                @click="removeWidget(index)"
                title="Eliminar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <div class="widget-resize-handle" @mousedown="startResize(widget)" title="Redimensionar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <polyline points="15 18 9 12 15 6" />
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            <component
              :is="resolveWidgetComponent(widget.type)"
              :tenant-id="tenantId"
              :date-range="dateRange"
              :period="widget.config?.period"
              :pipeline-id="widget.config?.pipelineId"
            />
          </div>
        </div>

        <!-- Add widget drop zone when editing -->
        <div
          v-if="editing"
          class="dashboard-add-zone"
          @dragover.prevent
          @drop="addWidgetFromLibrary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-8 h-8 text-zinc-400">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p>Suelta un widget aquí para añadirlo</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import FunnelChart from "./FunnelChart.vue";
import VelocityTrend from "./VelocityTrend.vue";
import ForecastTable from "./ForecastTable.vue";
import RepLeaderboard from "./RepLeaderboard.vue";
import CohortRetention from "./CohortRetention.vue";
import DateRangePicker from "./DateRangePicker.vue";
import Skeleton from "../Skeleton.vue";
import {
  FunnelIcon,
  TrendingUpIcon,
  BarChart2Icon,
  TrophyIcon,
  UsersIcon,
} from "@lucide/vue";

interface WidgetConfig {
  id: string;
  type: "funnel" | "velocity" | "forecast" | "leaderboard" | "cohort";
  x: number;
  y: number;
  spanX?: number;
  spanY?: number;
  config?: Record<string, any>;
}

interface LayoutWidget extends WidgetConfig {
  w: number;
  h: number;
  x: number;
  y: number;
}

interface AvailableWidget {
  id: string;
  name: string;
  description: string;
  type: "funnel" | "velocity" | "forecast" | "leaderboard" | "cohort";
  icon: any;
  color: string;
}

const availableWidgets = [
  {
    id: "funnel",
    name: "Embudo de Conversión",
    description: "Etapas, tasas de conversión y días promedio",
    type: "funnel",
    icon: FunnelIcon,
    color: "#3b82f6",
  },
  {
    id: "velocity",
    name: "Velocidad de Ventas",
    description: "Tendencia semanal de negocios, ingresos y reps activos",
    type: "velocity",
    icon: TrendingUpIcon,
    color: "#22c55e",
  },
  {
    id: "forecast",
    name: "Forecast de Pipeline",
    description: "Pipeline ponderado por mes y ranking de vendedores",
    type: "forecast",
    icon: BarChart2Icon,
    color: "#f59e0b",
  },
  {
    id: "leaderboard",
    name: "Ranking de Vendedores",
    description: "Ranking con ingresos, win rate y actividades",
    type: "leaderboard",
    icon: TrophyIcon,
    color: "#f97316",
  },
  {
    id: "cohort",
    name: "Retención de Cohortes",
    description: "Matriz de retención por cohorte mensual",
    type: "cohort",
    icon: UsersIcon,
    color: "#8b5cf6",
  },
];

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const editing = ref(false);
const columns = ref(12);
const layout = ref<LayoutWidget[]>([]);
const tenantId = ref<string>("default");

const dateRange = ref({ start: null, end: null });

const datePresets = [
  { key: "today", label: "Hoy", start: new Date(), end: new Date() },
  { key: "7d", label: "Últimos 7 días", start: new Date(Date.now() - 7 * 86400000), end: new Date() },
  { key: "30d", label: "Últimos 30 días", start: new Date(Date.now() - 30 * 86400000), end: new Date() },
  { key: "90d", label: "Últimos 90 días", start: new Date(Date.now() - 90 * 86400000), end: new Date() },
];

const resolveWidgetComponent = (type: string) => {
  const components: Record<string, any> = {
    funnel: FunnelChart,
    velocity: VelocityTrend,
    forecast: ForecastTable,
    leaderboard: RepLeaderboard,
    cohort: CohortRetention,
  };
  return components[type] || FunnelChart;
};

const onDragStart = (widget: AvailableWidget) => {
  // Set drag data
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDrop = (e: DragEvent) => {
  // Handle dropping widget from library
};

const addWidgetFromLibrary = (e: DragEvent) => {
  // Add widget from library
};

const editWidget = (widget: LayoutWidget) => {
  // Open config modal
};

const removeWidget = (index: number) => {
  layout.value.splice(index, 1);
  saveLayoutToStorage();
};

const startResize = (widget: LayoutWidget) => {
  // Start resize
};

const saveLayout = () => {
  saveLayoutToStorage();
  editing.value = false;
  toast.exito("Layout guardado");
};

const saveLayoutToStorage = () => {
  localStorage.setItem("dashboard-layout", JSON.stringify(layout.value));
};

const loadLayoutFromStorage = () => {
  const saved = localStorage.getItem("dashboard-layout");
  if (saved) {
    try {
      layout.value = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading layout:", e);
    }
  }
};

onMounted(() => {
  loadLayoutFromStorage();
});
</script>

<style scoped>
.dashboard-builder {
  min-height: 100vh;
  background: var(--crm-bg, #faf9f7);
  display: flex;
  flex-direction: column;
}

.dashboard-builder__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  background: var(--crm-card, #fff);
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  flex-wrap: wrap;
}

.dashboard-builder__title-section {
  flex: 1;
  min-width: 200px;
}

.dashboard-builder__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--crm-fg, #1c1917);
  margin: 0 0 0.25rem;
}

.dashboard-builder__subtitle {
  font-size: 0.875rem;
  color: var(--crm-muted-fg, #78716c);
  margin: 0;
}

.dashboard-builder__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dashboard-builder__sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: var(--crm-card, #fff);
  border-left: 1px solid var(--crm-border, #e2e8f0);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.dashboard-builder__sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.dashboard-builder__sidebar-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
  margin: 0;
}

.widget-library {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.widget-library__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--crm-bg-secondary, #f8fafc);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-md, 0.5rem);
  margin-bottom: 0.5rem;
  cursor: grab;
  transition: all 0.15s;
}

.widget-library__item:hover {
  border-color: var(--crm-primary, #2563eb);
  box-shadow: var(--crm-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
}

.widget-library__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--crm-radius-md, 0.5rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.widget-library__info {
  flex: 1;
  min-width: 0;
}

.widget-library__name {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--crm-fg, #1c1917);
}

.widget-library__desc {
  display: block;
  font-size: 0.75rem;
  color: var(--crm-muted-fg, #78716c);
}

.dashboard-builder__main {
  flex: 1;
  padding: 1.5rem;
  transition: margin-right 0.2s ease;
}

.dashboard-builder__main--editing {
  margin-right: 320px;
}

.dashboard-grid {
  display: grid;
  gap: 1rem;
  grid-auto-rows: minmax(300px, auto);
}

.dashboard-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--crm-muted-fg, #78716c);
  border: 2px dashed var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-lg, 0.75rem);
  background: var(--crm-bg-secondary, #f8fafc);
}

.dashboard-empty p {
  margin-top: 1rem;
  font-size: 1rem;
  color: var(--crm-muted-fg, #78716c);
}

.dashboard-widget-slot {
  min-height: 300px;
}

.widget-wrapper {
  position: relative;
  height: 100%;
  border-radius: var(--crm-radius-lg, 0.75rem);
  overflow: hidden;
  background: var(--crm-card, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  transition: box-shadow 0.2s;
}

.widget-wrapper:hover {
  box-shadow: var(--crm-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
}

.widget-wrapper--editing {
  border: 2px dashed var(--crm-primary, #2563eb);
}

.widget-toolbar {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.widget-wrapper--editing .widget-toolbar {
  opacity: 1;
}

.widget-toolbar__btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted-fg, #64748b);
  background: var(--crm-card, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius, 0.5rem);
  cursor: pointer;
  box-shadow: var(--crm-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.05));
  transition: all 0.15s;
}

.widget-toolbar__btn:hover {
  color: var(--crm-fg, #1c1917);
  background: var(--crm-muted, #f4f2ed);
  border-color: var(--crm-primary, #2563eb);
}

.widget-resize-handle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted-fg, #64748b);
  background: var(--crm-card, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius, 0.5rem);
  cursor: se-resize;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.widget-resize-handle:hover {
  color: var(--crm-brand, #2563eb);
  border-color: var(--crm-brand, #2563eb);
}

.dashboard-add-zone {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--crm-muted-fg, #78716c);
  border: 2px dashed var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-lg, 0.75rem);
  background: var(--crm-bg-secondary, #f8fafc);
}

.dashboard-add-zone p {
  margin-top: 1rem;
  font-size: 1rem;
  color: var(--crm-muted-fg, #78716c);
}

@media (max-width: 1024px) {
  .dashboard-builder__sidebar {
    width: 100%;
    max-height: 50vh;
    bottom: 0;
    top: auto;
    border-left: none;
    border-top: 1px solid var(--crm-border, #e2e8f0);
  }

  .dashboard-builder__main--editing {
    margin-right: 0;
  }
}

@media (prefers-color-scheme: dark) {
  .widget-library__item {
    background: var(--crm-bg, #1e293b);
    border-color: var(--crm-border, #334155);
  }
  .widget-library__item:hover {
    border-color: var(--crm-primary, #3b82f6);
  }
}
</style>