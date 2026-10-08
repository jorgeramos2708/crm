<template>
  <div class="widget widget--funnel">
    <div class="widget__header">
      <h3 class="widget__title">Embudo de Conversión</h3>
      <div class="widget__actions">
        <select
          v-model="period"
          @change="fetchData"
          class="widget__select"
        >
          <option value="7d">7 días</option>
          <option value="30d">30 días</option>
          <option value="90d">90 días</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="widget__loading">
      <Skeleton :filas="3" />
    </div>

    <div v-else-if="!funnelData?.stages?.length" class="widget__empty">
      <p>No hay datos de embudo para el período seleccionado.</p>
    </div>

    <div v-else class="widget__content">
      <!-- Funnel Visualization -->
      <div class="funnel-visualization">
        <div
          v-for="stage in funnelData.stages"
          :key="stage.stageId"
          class="funnel-stage"
          :style="{ '--funnel-width': `${stage.conversionRate || 0}%` }"
        >
          <div class="funnel-stage__bar">
            <div class="funnel-stage__fill" :style="{ width: `${stage.conversionRate || 0}%` }"></div>
          </div>
          <div class="funnel-stage__info">
            <span class="funnel-stage__name">{{ stage.stageName }}</span>
            <span class="funnel-stage__metrics">
              <span class="funnel-stage__entered">Entraron: {{ stage.entered }}</span>
              <span class="funnel-stage__exited">Salieron: {{ stage.exited }}</span>
              <span class="funnel-stage__rate">{{ stage.conversionRate?.toFixed(1) }}%</span>
              <span class="funnel-stage__days">Ø {{ stage.avgDaysInStage?.toFixed(1) || 0 }}d</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="funnel-summary">
        <div class="funnel-summary__item">
          <span class="funnel-summary__label">Total Entraron</span>
          <span class="funnel-summary__value">{{ funnelData.summary?.totalEntered || 0 }}</span>
        </div>
        <div class="funnel-summary__item">
          <span class="funnel-summary__label">Total Salieron</span>
          <span class="funnel-summary__value">{{ funnelData.summary?.totalExited || 0 }}</span>
        </div>
        <div class="funnel-summary__item funnel-summary__item--highlight">
          <span class="funnel-summary__label">Conversión Global</span>
          <span class="funnel-summary__value">{{ funnelData.summary?.overallConversion?.toFixed(1) || 0 }}%</span>
        </div>
        <div class="funnel-summary__item">
          <span class="funnel-summary__label">Período</span>
          <span class="funnel-summary__value">{{ formatDate(funnelData.summary?.periodStart) }} - {{ formatDate(funnelData.summary?.periodEnd) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import Skeleton from "../Skeleton.vue";

interface FunnelStage {
  stageId: string;
  stageName: string;
  stageOrder: number;
  entered: number;
  exited: number;
  conversionRate: number | null;
  avgDaysInStage: number | null;
}

interface FunnelData {
  stages: FunnelStage[];
  summary: {
    periodStart: string;
    periodEnd: string;
    totalEntered: number;
    totalExited: number;
    overallConversion: number;
  } | null;
}

const props = defineProps<{
  tenantId?: string;
}>();

const authStore = useAuthStore();
const funnelData = ref<FunnelData | null>(null);
const loading = ref(true);
const period = ref("30d");

const fetchData = async () => {
  loading.value = true;
  try {
    const tid = props.tenantId || authStore.user?.tenantId || "default";
    const response = await axios.get("/api/reportes/funnel", {
      params: { pipelineId: "", period: period.value },
      headers: { "X-Tenant-ID": tid },
    });
    funnelData.value = response.data;
  } catch (e) {
    console.error("Error fetching funnel data:", e);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

onMounted(() => {
  fetchData();
});

watch(period, fetchData);
</script>

<style scoped>
.widget {
  background: var(--crm-card, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-lg, 0.75rem);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1rem 0.5rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.widget__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
}

.widget__select {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid var(--crm-border, #e2e8f0);
  border-radius: var(--crm-radius-sm, 0.375rem);
  background: var(--crm-bg, #faf9f7);
  color: var(--crm-fg, #1c1917);
}

.widget__loading {
  padding: 1.5rem;
}

.widget__empty {
  padding: 2rem;
  text-align: center;
  color: var(--crm-muted-fg, #78716c);
}

.widget__content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

/* Funnel Visualization */
.funnel-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.funnel-stage {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.funnel-stage__bar {
  width: 100%;
  height: 40px;
  background: var(--crm-muted, #f4f2ed);
  border-radius: var(--crm-radius-md, 0.5rem);
  overflow: hidden;
  position: relative;
}

.funnel-stage__fill {
  height: 100%;
  background: var(--crm-brand, #2563eb);
  border-radius: var(--crm-radius-md, 0.5rem);
  transition: width 0.5s ease;
}

.funnel-stage__info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.funnel-stage__name {
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
  text-align: center;
}

.funnel-stage__metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  color: var(--crm-muted-fg, #78716c);
  font-size: 0.7rem;
}

.funnel-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--crm-border, #e2e8f0);
}

.funnel-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--crm-muted, #f4f2ed);
  border-radius: var(--crm-radius-md, 0.5rem);
}

.funnel-summary__item--highlight {
  grid-column: span 2;
  background: color-mix(in srgb, var(--crm-brand, #2563eb) 10%, transparent);
  border: 1px solid var(--crm-brand, #2563eb);
}

.funnel-summary__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--crm-muted-fg, #78716c);
}

.funnel-summary__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--crm-fg, #1c1917);
}

.funnel-summary__item--highlight .funnel-summary__value {
  color: var(--crm-brand, #2563eb);
}

@media (prefers-color-scheme: dark) {
  .funnel-stage__bar {
    background: var(--crm-muted, rgba(255, 255, 255, 0.1));
  }
  .widget__content {
    background: var(--crm-card, #292524);
  }
}
</style>