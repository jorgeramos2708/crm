<template>
  <div class="widget widget--leaderboard">
    <div class="widget__header">
      <h3 class="widget__title">Ranking de Vendedores</h3>
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
      <Skeleton :filas="5" />
    </div>

    <div v-else-if="!leaderboardData?.length" class="widget__empty">
      <p>No hay datos de ranking para el período seleccionado.</p>
    </div>

    <div v-else class="widget__content">
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Vendedor</th>
            <th class="text-right">Creados</th>
            <th class="text-right">Ganados</th>
            <th class="text-right">Perdidos</th>
            <th class="text-right">Ingresos</th>
            <th class="text-right">Win Rate</th>
            <th class="text-right">Ø Ciclo</th>
            <th class="text-right">Actividades</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(rep, index) in leaderboardData"
            :key="rep.userId"
            :class="index < 3 ? 'leaderboard-row--top' : ''"
          >
            <td>
              <span class="leaderboard-rank" :class="{ 'gold': index === 0, 'silver': index === 1, 'bronze': index === 2 }">
                {{ index + 1 }}
              </span>
            </td>
            <td>
              <div class="rep-info">
                <span class="rep-avatar">{{ rep.userName.charAt(0).toUpperCase() }}</span>
                <div>
                  <span class="rep-name">{{ rep.userName }}</span>
                  <span class="rep-meta">{{ rep.activitiesCount }} actividades</span>
                </div>
              </div>
              </td>
              <td class="text-right">{{ rep.dealsCreated }}</td>
              <td class="text-right">
                <span class="leaderboard-won">{{ rep.dealsWon }}</span>
              </td>
              <td class="text-right">
                <span class="leaderboard-lost">{{ rep.dealsLost }}</span>
              </td>
              <td class="text-right">
                <span class="leaderboard-revenue">{{ formatCurrency(rep.revenueWon) }}</span>
              </td>
              <td class="text-right">
                <span :class="['win-rate', rep.winRate >= 50 ? 'win-rate--good' : 'win-rate--low']">
                  {{ rep.winRate.toFixed(1) }}%
                </span>
              </td>
              <td class="text-right">{{ rep.avgCycleDays.toFixed(1) }}d</td>
              <td class="text-right">{{ rep.activitiesCount }}</td>
            </tr>
          </tbody>
        </table>

      <!-- Charts Row -->
      <div class="leaderboard-charts">
        <div class="chart-mini">
          <h4>Ingresos por Vendedor</h4>
          <ResponsiveContainer width="100%" height="150">
            <BarChart :data="leaderboardData" layout="vertical" :margin="{ top: 10, right: 10, left: 80, bottom: 10 }">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" :tick="{ display: false }" />
              <YAxis type="category" dataKey="userName" :width="120" :tick="{ fontSize: 10 }" />
              <Tooltip :formatter="(value) => [formatCurrency(value), 'Ingresos']" />
              <Bar dataKey="revenueWon" fill="var(--crm-brand, #2563eb)" :radius="[0, 4, 4, 0]" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div class="chart-mini">
          <h4>Win Rate por Vendedor</h4>
          <ResponsiveContainer width="100%" height="150">
            <BarChart :data="leaderboardData" layout="vertical" :margin="{ top: 10, right: 10, left: 80, bottom: 10 }">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" :tick="{ display: false }" />
              <YAxis type="category" dataKey="userName" :width="120" :tick="{ fontSize: 10 }" />
              <Tooltip :formatter="(value) => [value.toFixed(1) + '%', 'Win Rate']" />
              <Bar dataKey="winRate" fill="var(--crm-success, #22c55e)" :radius="[0, 4, 4, 0]" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div v-if="editing" class="widget-toolbar">
      <button
        type="button"
        class="widget-toolbar__btn"
        @click="editWidget(widget)"
        title="Configurar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Skeleton from "../Skeleton.vue";

interface RepPerformance {
  userId: string;
  userName: string;
  dealsCreated: number;
  dealsWon: number;
  dealsLost: number;
  revenueWon: number;
  avgDealSize: number;
  winRate: number;
  avgCycleDays: number;
  activitiesCount: number;
  emailsSent: number;
  callsMade: number;
}

const props = defineProps<{
  tenantId?: string;
}>();

const authStore = useAuthStore();
const leaderboardData = ref<RepPerformance[]>([]);
const loading = ref(true);
const period = ref("4w");

const fetchData = async () => {
  loading.value = true;
  try {
    const tid = props.tenantId || authStore.user?.tenantId || "default";
    const response = await axios.get("/api/reportes/rep-performance", {
      params: { period: period.value },
      headers: { "X-Tenant-ID": tid },
    });
    leaderboardData.value = response.data;
  } catch (e) {
    console.error("Error fetching leaderboard data:", e);
  } finally {
    loading.value = false;
  }
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

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.leaderboard-table th {
  text-align: left;
  padding: 0.5rem 0.5rem;
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--crm-muted-fg, #78716c);
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
}

.leaderboard-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--crm-border, #e2e8f0);
  color: var(--crm-fg, #1c1917);
}

.leaderboard-table tr:last-child td {
  border-bottom: none;
}

.leaderboard-row--top {
  background: color-mix(in srgb, var(--crm-brand, #2563eb) 5%, transparent);
}

.leaderboard-row--top:first-child {
  background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
}

.leaderboard-row--top:nth-child(2) {
  background: linear-gradient(90deg, #f5f5f4 0%, #e7e5e4 100%);
}

.leaderboard-row--top:nth-child(3) {
  background: linear-gradient(90deg, #fef3c7 0%, #fde68a 100%);
}

.leaderboard-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.7rem;
  color: var(--crm-muted-fg, #78716c);
}

.leaderboard-rank.gold {
  background: #fbbf24;
  color: #1c1917;
}

.leaderboard-rank.silver {
  background: #d1d5db;
  color: #1c1917;
}

.leaderboard-rank.bronze {
  background: #fcd34d;
  color: #1c1917;
}

.rep-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  font-size: 0.7rem;
}

.rep-name {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--crm-fg, #1c1917);
}

.rep-meta {
  display: block;
  font-size: 0.65rem;
  color: var(--crm-muted-fg, #78716c);
}

.text-right {
  text-align: right;
}

.leaderboard-won {
  color: var(--crm-success, #22c55e);
  font-weight: 600;
}

.leaderboard-lost {
  color: var(--crm-destructive, #ef4444);
}

.leaderboard-revenue {
  font-weight: 600;
  color: var(--crm-brand, #2563eb);
}

.win-rate {
  font-weight: 600;
}

.win-rate--good {
  color: var(--crm-success, #22c55e);
}

.win-rate--low {
  color: var(--crm-destructive, #ef4444);
}

.leaderboard-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--crm-border, #e2e8f0);
}

.chart-mini {
  background: var(--crm-muted, #f4f2ed);
  border-radius: var(--crm-radius-md, 0.5rem);
  padding: 1rem;
}

.chart-mini h4 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--crm-muted-fg, #78716c);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (prefers-color-scheme: dark) {
  .chart-mini {
    background: var(--crm-muted, rgba(255, 255, 255, 0.05));
  }
}
</style>