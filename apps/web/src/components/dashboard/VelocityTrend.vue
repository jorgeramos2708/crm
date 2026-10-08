<template>
  <div class="widget widget--velocity">
    <div class="widget__header">
      <h3 class="widget__title">Velocidad de Ventas</h3>
      <div class="widget__actions">
        <select
          v-model="period"
          @change="fetchData"
          class="widget__select"
        >
          <option value="4w">4 semanas</option>
          <option value="12w">12 semanas</option>
          <option value="26w">26 semanas</option>
          <option value="52w">52 semanas</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="widget__loading">
      <Skeleton :filas="3" />
    </div>

    <div v-else-if="!velocityData?.weekly?.length" class="widget__empty">
      <p>No hay datos de velocidad para el período seleccionado.</p>
    </div>

    <div v-else class="widget__content">
      <div class="chart-container" style="height: 250px;">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart :data="velocityData.weekly" :margin="{ top: 10, right: 10, left: 0, bottom: 0 }">
            <CartesianGrid strokeDasharray="3 3" :stroke="getColor('--crm-border', '#e2e8f0')" />
            <XAxis
              dataKey="week"
              :tickFormatter="formatWeek"
              :tick="{ fill: getColor('--crm-muted-fg', '#78716c'), fontSize: 10 }"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter="(value) => value"
              :tick="{ fill: getColor('--crm-muted-fg', '#78716c'), fontSize: 10 }"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter="formatCurrency"
              :tick="{ fill: getColor('--crm-muted-fg', '#78716c'), fontSize: 10 }"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              :formatter="tooltipFormatter"
              :labelFormatter="formatWeek"
              :contentStyle="{
                backgroundColor: 'var(--crm-card, #fff)',
                border: '1px solid var(--crm-border, #e2e8f0)',
                borderRadius: 'var(--crm-radius-md, 0.5rem)',
                boxShadow: 'var(--crm-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))',
              }"
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="deals"
              name="Negocios"
              :stroke="getColor('--crm-info', '#3b82f6')"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              name="Ingresos"
              :stroke="getColor('--crm-success', '#22c55e')"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="activeReps"
              name="Reps Activos"
              :stroke="getColor('--crm-warning', '#eab308')"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <!-- Top Reps Table -->
      <div class="velocity-reps" v-if="velocityData.reps?.length">
        <h4 class="velocity-reps__title">Top Vendedores</h4>
        <table class="velocity-reps__table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th class="text-right">Negocios</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ø Ciclo (días)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rep in velocityData.reps.slice(0, 5)"
              :key="rep.userId"
            >
              <td>
                <div class="rep-info">
                  <span class="rep-avatar">{{ rep.userName.charAt(0).toUpperCase() }}</span>
                  <span class="rep-name">{{ rep.userName }}</span>
                </div>
              </td>
              <td class="text-right">{{ rep.deals }}</td>
              <td class="text-right">{{ formatCurrency(rep.revenue) }}</td>
              <td class="text-right">{{ rep.avgCycleDays.toFixed(1) }}</td>
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
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAuthStore } from "@/stores/auth";
import Skeleton from "../Skeleton.vue";

interface WeeklyData {
  week: string;
  deals: number;
  revenue: number;
  activeReps: number;
}

interface RepData {
  userId: string;
  userName: string;
  deals: number;
  revenue: number;
  avgCycleDays: number;
  weekCount: number;
}

interface VelocityData {
  weekly: WeeklyData[];
  reps: any[];
}

const props = defineProps<{
  tenantId?: string;
  period?: string;
  dateRange?: { start: Date | null; end: Date | null };
}>();

const authStore = useAuthStore();
const velocityData = ref<VelocityData | null>(null);
const loading = ref(true);
const period = ref(props.period || "12w");

const formatWeek = (weekStr: string) => {
  const date = new Date(weekStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getColor = (varName: string, fallback: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
};

const tooltipFormatter = (value: number, name: string) => {
  if (name === "revenue") return [formatCurrency(value), "Ingresos"];
  return [value, name === "deals" ? "Negocios" : "Reps Activos"];
};

const fetchData = async () => {
  loading.value = true;
  try {
    const tid = props.tenantId || authStore.user?.tenantId || "default";
    const response = await axios.get("/api/reportes/velocity", {
      params: { period: period.value },
      headers: { "X-Tenant-ID": tid },
    });
    velocityData.value = response.data;
  } catch (e) {
    console.error("Error fetching velocity data:", e);
  } finally {
    loading.value = false;
  }
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

.chart-container {
  height: 250px;
  margin-bottom: 1.5rem;
}

.velocity-reps {
  border-top: 1px solid var(--crm-border, #e2e8f0);
  padding-top: 1rem;
}

.velocity-reps__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--crm-fg, #1c1917);
  margin-bottom: 0.75rem;
}

.velocity-reps__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.velocity-reps__table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: var(--crm-muted-fg, #64748b);
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.velocity-reps__table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  color: var(--crm-fg, #1c1917);
}

.velocity-reps__table tr:last-child td {
  border-bottom: none;
}

.velocity-reps__table .text-right {
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
  .recharts-tooltip-wrapper {
    background: var(--crm-card, #292524) !important;
    border-color: var(--crm-border, #44403c) !important;
  }
}
</style>