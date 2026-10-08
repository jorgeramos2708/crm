<template>
  <div class="widget widget--forecast">
    <div class="widget__header">
      <h3 class="widget__title">Forecast de Pipeline</h3>
      <div class="widget__actions">
        <select
          v-model="period"
          @change="fetchData"
          class="widget__select"
        >
          <option value="3m">3 meses</option>
          <option value="6m">6 meses</option>
          <option value="12m">12 meses</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="widget__loading">
      <Skeleton :filas="4" />
    </div>

    <div v-else-if="!forecastData?.monthly?.length" class="widget__empty">
      <p>No hay datos de forecast para el período seleccionado.</p>
    </div>

    <div v-else class="widget__content">
      <div class="forecast-summary">
        <div class="forecast-summary__item">
          <span class="forecast-summary__label">Pipeline Ponderado Total</span>
          <span class="forecast-summary__value forecast-summary__value--primary">{{ formatCurrency(totalWeighted) }}</span>
        </div>
        <div class="forecast-summary__item">
          <span class="forecast-summary__label">Total Negocios</span>
          <span class="forecast-summary__value">{{ totalDeals }}</span>
        </div>
        <div class="forecast-summary__item">
          <span class="forecast-summary__label">Reps Activos</span>
          <span class="forecast-summary__value">{{ activeRepsCount }}</span>
        </div>
      </div>

      <div class="forecast-table">
        <table class="forecast-table__table">
          <thead>
            <tr>
              <th>Mes</th>
              <th class="text-right">Pipeline Ponderado</th>
              <th class="text-right">Negocios</th>
              <th class="text-right">Reps Activos</th>
            </tr>
          </thead>
<tbody>
            <tr
              v-for="month in forecastData.monthly"
              :key="month.month"
            >
              <td>{{ formatMonth(month.month) }}</td>
              <td class="text-right">
                <span :class="['forecast-value', month.weightedPipeline > avgWeighted ? 'forecast-value--above' : '']">
                  {{ formatCurrency(month.weightedPipeline) }}
                </span>
              </td>
              <td class="text-right">{{ month.dealCount }}</td>
              <td class="text-right">{{ month.activeReps }}</td>
            </tr>
            <tr class="forecast-table__total">
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>{{ formatCurrency(totalWeighted) }}</strong></td>
              <td class="text-right"><strong>{{ totalDeals }}</strong></td>
              <td class="text-right"><strong>{{ activeRepsCount }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top Reps by Forecast -->
      <div class="forecast-reps" v-if="forecastData.reps?.length">
        <h4 class="forecast-reps__title">Top Vendedores por Pipeline</h4>
        <table class="forecast-reps__table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th class="text-right">Pipeline Ponderado</th>
              <th class="text-right">Negocios</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rep in forecastData.reps.slice(0, 5)"
              :key="rep.userId"
            >
              <td>
                <div class="rep-info">
                  <span class="rep-avatar">{{ rep.userName.charAt(0).toUpperCase() }}</span>
                  <span class="rep-name">{{ rep.userName }}</span>
                </div>
              </td>
              <td class="text-right">{{ formatCurrency(rep.weighted) }}</td>
              <td class="text-right">{{ rep.deals }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import Skeleton from "../Skeleton.vue";

interface ForecastMonth {
  month: string;
  weightedPipeline: number;
  dealCount: number;
  activeReps: number;
}

interface ForecastRep {
  userId: string;
  userName: string;
  weighted: number;
  deals: number;
}

interface ForecastData {
  monthly: ForecastMonth[];
  reps: ForecastRep[];
}

const props = defineProps<{
  tenantId?: string;
  period?: string;
  dateRange?: { start: Date | null; end: Date | null };
}>();

const authStore = useAuthStore();
const forecastData = ref<ForecastData | null>(null);
const loading = ref(true);
const period = ref(props.period || "6m");

const fetchData = async () => {
  loading.value = true;
  try {
    const tid = props.tenantId || authStore.user?.tenantId || "default";
    const response = await axios.get("/api/reportes/forecast", {
      params: { period: period.value },
      headers: { "X-Tenant-ID": tid },
    });
    forecastData.value = response.data;
  } catch (e) {
    console.error("Error fetching forecast data:", e);
  } finally {
    loading.value = false;
  }
};

const totalWeighted = computed(() => {
  return forecastData.value?.monthly.reduce((sum, m) => sum + m.weightedPipeline, 0) || 0;
});

const totalDeals = computed(() => {
  return forecastData.value?.monthly.reduce((sum, m) => sum + m.dealCount, 0) || 0;
});

const activeRepsCount = computed(() => {
  return forecastData.value?.monthly.reduce((sum, m) => sum + m.activeReps, 0) || 0;
});

const avgWeighted = computed(() => {
  const months = forecastData.value?.monthly.length || 0;
  return months > 0 ? totalWeighted.value / months : 0;
});

const formatMonth = (monthStr: string) => {
  const date = new Date(monthStr + "-01T00:00:00");
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

onMounted(() => {
  fetchData();
});

watch(() => props.period, fetchData);
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

.forecast-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.forecast-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--crm-muted, #f4f2ed);
  border-radius: var(--crm-radius-md, 0.5rem);
}

.forecast-summary__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--crm-muted-fg, #64748b);
}

.forecast-summary__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--crm-fg, #1c1917);
}

.forecast-summary__value--primary {
  color: var(--crm-brand, #2563eb);
}

.forecast-table {
  overflow-x: auto;
}

.forecast-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.forecast-table__table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--crm-muted-fg, #64748b);
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.forecast-table__table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  color: var(--crm-fg, #1c1917);
}

.forecast-table__table tr:last-child td {
  border-bottom: none;
}

.forecast-table__table .text-right {
  text-align: right;
}

.forecast-table__total {
  background: var(--crm-muted, #f4f2ed);
}

.forecast-table__total td {
  border-top: 2px solid var(--crm-border, #e2e8f0);
  border-bottom: none;
}

.forecast-value {
  font-weight: 500;
  color: var(--crm-fg, #1c1917);
}

.forecast-value--above {
  color: var(--crm-success, #22c55e);
  font-weight: 600;
}

.forecast-reps {
  margin-top: 1.5rem;
  border-top: 1px solid var(--crm-border, #e2e8f0);
  padding-top: 1rem;
}

.forecast-reps__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
  margin-bottom: 0.75rem;
}

.forecast-reps__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.forecast-reps__table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--crm-muted-fg, #64748b);
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.forecast-reps__table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  color: var(--crm-fg, #1c1917);
}

.forecast-reps__table tr:last-child td {
  border-bottom: none;
}

.forecast-reps__table .text-right {
  text-align: right;
}

.rep-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rep-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--crm-brand, #2563eb);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
}

.rep-name {
  font-weight: 500;
  color: var(--crm-fg, #1c1917);
}

.text-right {
  text-align: right;
}

@media (prefers-color-scheme: dark) {
  .widget__content {
    background: var(--crm-card, #292524);
  }
}
</style>