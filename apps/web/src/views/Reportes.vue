<template>
  <div class="p-6">
    <header class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <p class="text-sm text-zinc-500">Embudo por etapa · {{ currency }}</p>
      <select v-model="pipelineId" @change="fetchFunnel" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todos los pipelines</option>
        <option v-for="p in pipelines" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
        <div class="text-sm text-zinc-500">Oportunidades</div>
        <div class="text-3xl font-bold mt-1">{{ funnel.total || 0 }}</div>
      </div>
      <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
        <div class="text-sm text-zinc-500">Valor total</div>
        <div class="text-3xl font-bold mt-1">{{ formatCurrency(funnel.valorTotal) }}</div>
      </div>
      <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
        <div class="text-sm text-zinc-500">Ponderado × probabilidad</div>
        <div class="text-3xl font-bold mt-1">{{ formatCurrency(funnel.ponderadoTotal) }}</div>
      </div>
      <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
        <div class="text-sm text-zinc-500">Ticket medio</div>
        <div class="text-3xl font-bold mt-1">{{ formatCurrency(funnel.ticketMedio) }}</div>
      </div>
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
      <h2 class="text-lg font-semibold mb-4">Embudo por etapa</h2>
      <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
      <div v-else class="space-y-4">
        <div v-for="e in funnel.etapas || []" :key="e.stageId">
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="font-medium flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ backgroundColor: e.color || '#3b82f6' }"></span>
              {{ e.nombre }}
            </span>
            <span class="text-zinc-500">{{ e.count }} · {{ formatCurrency(e.importe) }} · pond. {{ formatCurrency(e.ponderado) }}</span>
          </div>
          <div class="h-3 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
            <div class="h-full rounded-full transition-all" :style="{ width: pct(e.count) + '%', backgroundColor: e.color || '#3b82f6' }"></div>
          </div>
        </div>
        <p v-if="!(funnel.etapas?.length)" class="text-sm text-zinc-500">Sin etapas.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { formatCurrency, loadCurrency, currency } from '../utils/currency'

const funnel = ref({ total: 0, valorTotal: 0, ponderadoTotal: 0, ticketMedio: 0, etapas: [] })
const pipelines = ref([])
const pipelineId = ref('')
const loading = ref(true)

const pct = (count) => {
  const max = Math.max(1, ...((funnel.value.etapas || []).map(e => e.count)))
  return Math.round((count / max) * 100)
}

const fetchFunnel = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/reportes/embudo', { params: pipelineId.value ? { pipelineId: pipelineId.value } : {} })
    funnel.value = data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(async () => {
  await loadCurrency()
  try {
    const { data } = await axios.get('/api/pipelines')
    pipelines.value = data.data || data
  } catch { /* */ }
  await fetchFunnel()
})
</script>
