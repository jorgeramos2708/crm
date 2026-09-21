<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <main class="max-w-7xl mx-auto px-4 py-6">
<h2 class="text-3xl font-bold tracking-tight mb-6">
        Bienvenido, {{ authStore.user?.name || "Usuario" }}
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card class="p-6">
          <h2
            class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4"
          >
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
              v-for="opp in oportunidades"
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
              <span
                class="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                >{{ formatCurrency(opp.importe) }}</span
              >
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <h2
            class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4"
          >
            Oportunidades por etapa
          </h2>
          <div class="space-y-4">
            <div
              v-for="stage in pipelineStages"
              :key="stage.id"
              class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: stage.color || '#3b82f6' }"
                ></div>
                <span class="font-medium text-zinc-900 dark:text-zinc-100">{{
                  stage.nombre
                }}</span>
              </div>
              <span class="text-zinc-500"
                >{{ stage.count || 0 }} oportunidades</span
              >
            </div>
          </div>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import axios from "axios";
import { toast } from "../utils/toast";
import Skeleton from "../components/Skeleton.vue";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";

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

const nombreEtapa = (stageId) => {
  const s = pipelineStages.value.find((x) => x.id === stageId);
  return s ? s.nombre : "Sin etapa";
};

const colorEtapa = (stageId) => {
  const s = pipelineStages.value.find((x) => x.id === stageId);
  return s?.color || "#3b82f6";
};

const fetchDashboard = async () => {
  try {
    const [statsRes, oppsRes, stagesRes] = await Promise.all([
      axios.get("/api/dashboard/stats"),
      axios.get("/api/oportunidades?limit=5"),
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

onMounted(async () => {
  await loadCurrency();
  fetchDashboard();
});
</script>
