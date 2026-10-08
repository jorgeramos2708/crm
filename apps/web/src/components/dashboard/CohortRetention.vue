<template>
  <div class="widget widget--cohort">
    <div class="widget__header">
      <h3 class="widget__title">Retención de Cohortes</h3>
      <div class="widget__actions">
        <select
          v-model="months"
          @change="fetchData"
          class="widget__select"
        >
          <option value="6">6 meses</option>
          <option value="12">12 meses</option>
          <option value="24">24 meses</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="widget__loading">
      <Skeleton :filas="5" />
    </div>

    <div v-else-if="!cohortData?.length" class="widget__empty">
      <p>No hay datos de retención para el período seleccionado.</p>
    </div>

    <div v-else class="widget__content">
      <div class="cohort-table-container">
        <table class="cohort-table">
          <thead>
            <tr>
              <th class="cohort-table__cohort">Cohorte</th>
              <th class="cohort-table__size">Tamaño</th>
              <th
                v-for="i in maxPeriod"
                :key="i"
                class="cohort-table__period"
              >
                M{{ i }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cohort in cohortData"
              :key="cohort.cohortMonth"
            >
              <td class="cohort-table__cohort">
                <div class="cohort-info">
                  <span class="cohort-month">{{ formatCohortMonth(cohort.cohortMonth) }}</span>
                  <span class="cohort-size-badge">{{ cohort.size }}</span>
                </div>
              </td>
              <td class="cohort-table__size">{{ cohort.size }}</td>
              <td
                v-for="i in maxPeriod"
                :key="i"
                class="cohort-table__cell"
              >
                <div
                  v-if="cohort.periods[i]"
                  class="cohort-cell"
                  :class="{ 'cohort-cell--good': cohort.periods[i].rate >= 50, 'cohort-cell--low': cohort.periods[i].rate < 25 }"
                >
                  <span class="cohort-rate">{{ cohort.periods[i].rate.toFixed(1) }}%</span>
                  <span class="cohort-retained">({{ cohort.periods[i].retained }})</span>
                </div>
                <div v-else class="cohort-cell cohort-cell--empty">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Average Retention by Period -->
      <div class="cohort-averages">
        <h4 class="cohort-averages__title">Retención Promedio por Mes</h4>
        <ResponsiveContainer width="100%" height="200">
          <LineChart :data="averageRetention" :margin="{ top: 10, right: 10, left: 0, bottom: 0 }">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickFormatter="(value) => `M${value}`"
              :tick="{ fill: getColor('--crm-muted-fg', '#78716c'), fontSize: 10 }"
            />
            <YAxis
              tickFormatter="(value) => `${value}%`"
              :tick="{ fill: getColor('--crm-muted-fg', '#78716c'), fontSize: 10 }"
              domain={[0, 100]}
            />
            <Tooltip
              :formatter="(value) => [value.toFixed(1) + '%', 'Retención']"
              labelFormatter="(value) => `Mes ${value}`"
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Retención %"
              :stroke="getColor('--crm-brand', '#2563eb')"
              strokeWidth={2}
              dot={{ r: 4 }}
              :activeDot="{ r: 6 }"
            />
          </LineChart>
        </ResponsiveContainer>

        <!-- Cohort Size Trend -->
        <ResponsiveContainer width="100%" height="150" class="mt-4">
          <BarChart :data="cohortSizes" layout="vertical" :margin="{ top: 10, right: 10, left: 80, bottom: 10 }">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ display: false }} />
            <YAxis type="category" dataKey="cohort" width={100} tick={{ fontSize: 10 }} />
            <Tooltip formatter="(value) => [value, 'Tamaño']" />
            <Bar dataKey="size" fill="var(--crm-info, #3b82f6)" :radius="[0, 4, 4, 0]" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import Skeleton from "../Skeleton.vue";

interface CohortPeriod {
  retained: number;
  rate: number;
}

interface CohortData {
  cohortMonth: string;
  size: number;
  periods: Record<number, CohortPeriod>;
}

interface CohortSize {
  cohort: string;
  size: number;
}

const props = defineProps<{
  tenantId?: string;
  months?: string;
}>();

const authStore = useAuthStore();
const cohortData = ref<CohortData[]>([]);
const loading = ref(true);
const months = ref(props.months || "12");

const fetchData = async () => {
  loading.value = true;
  try {
    const tid = props.tenantId || authStore.user?.tenantId || "default";
    const response = await axios.get("/api/reportes/cohort-retention", {
      params: { months: months.value },
      headers: { "X-Tenant-ID": tid },
    });
    cohortData.value = response.data;
  } catch (e) {
    console.error("Error fetching cohort data:", e);
  } finally {
    loading.value = false;
  }
};

const maxPeriod = computed(() => {
  let max = 0;
  cohortData.value.forEach((c) => {
    Object.keys(c.periods).forEach((k) => {
      max = Math.max(max, parseInt(k));
    });
  });
  return max || 12;
});

const averageRetention = computed(() => {
  const max = maxPeriod.value;
  const rates: Record<number, number[]> = {};

  cohortData.value.forEach((c) => {
    Object.entries(c.periods).forEach(([period, data]) => {
      const p = parseInt(period);
      if (!rates[p]) rates[p] = [];
      rates[p].push(data.rate);
    });
  });

  return Object.entries(rates)
    .map(([period, rates]) => ({
      period: parseInt(period),
      rate: rates.reduce((a, b) => a + b, 0) / rates.length,
    }))
    .sort((a, b) => a.period - b.period);
});

const cohortSizes = computed(() => {
  return cohortData.value
    .map((c) => ({
      cohort: formatCohortMonth(c.cohortMonth),
      size: c.size,
    }))
    .reverse();
});

const formatCohortMonth = (monthStr: string) => {
  const date = new Date(monthStr + "-01T00:00:00");
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
};

const formatPeriodLabel = (period: number) => `M${period}`;

const getColor = (varName: string, fallback: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

onMounted(() => {
  fetchData();
});

watch(() => props.months, fetchData);
watch(months, fetchData);
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
  color: var(--crm-muted-fg, #64748b);
}

.widget__content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.cohort-table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.cohort-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  min-width: 600px;
}

.cohort-table th {
  text-align: left;
  padding: 0.5rem;
  font-weight: 600;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--crm-muted-fg, #64748b);
  border-bottom: 2px solid var(--crm-border, #e2e8f0);
  background: var(--crm-muted, #f4f2ed);
  position: sticky;
  top: 0;
  z-index: 1;
}

.cohort-table__cohort {
  min-width: 140px;
  font-weight: 600;
}

.cohort-table__size {
  width: 60px;
  text-align: right;
}

.cohort-table__period {
  width: 50px;
  text-align: center;
  font-size: 0.6rem;
}

.cohort-table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  vertical-align: middle;
}

.cohort-table tbody tr:last-child td {
  border-bottom: none;
}

.cohort-table tbody tr:hover td {
  background: var(--crm-muted, #f4f2ed);
}

.cohort-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.cohort-month {
  font-weight: 500;
  font-size: 0.7rem;
  color: var(--crm-fg, #1c1917);
}

.cohort-size-badge {
  font-size: 0.6rem;
  color: var(--crm-muted-fg, #64748b);
}

.cohort-cell {
  text-align: center;
  padding: 0.25rem;
  border-radius: var(--crm-radius-sm, 0.375rem);
  transition: background 0.2s;
}

.cohort-cell--good {
  background: color-mix(in srgb, var(--crm-success, #22c55e) 15%, transparent);
}

.cohort-cell--low {
  background: color-mix(in srgb, var(--crm-destructive, #ef4444) 15%, transparent);
}

.cohort-cell--empty {
  color: var(--crm-muted-fg, #64748b);
  font-style: italic;
}

.cohort-rate {
  display: block;
  font-weight: 600;
  font-size: 0.7rem;
}

.cohort-retained {
  display: block;
  font-size: 0.6rem;
  color: var(--crm-muted-fg, #64748b);
}

.cohort-averages {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--crm-border, #e2e8f0);
}

.cohort-averages__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
  margin-bottom: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  .cohort-table th {
    background: var(--crm-muted, rgba(255, 255, 255, 0.05));
  }
  .cohort-table tbody tr:hover td {
    background: var(--crm-muted, rgba(255, 255, 255, 0.05));
  }
}
</style>