<template>
  <div class="p-6">
    <header class="mb-6 flex items-center justify-end flex-wrap gap-2">
      <select v-model="pipelineId" @change="fetchFunnel" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todos los pipelines</option>
        <option v-for="p in pipelines" :key="p.id" :value="p.id">{{ p.nombre }}</option>
      </select>
      <button @click="window.print()" class="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 print:hidden">Exportar PDF</button>
    </header>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-8">
      <StatCard title="Oportunidades" :value="funnel.total || 0" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="blue" />
      <StatCard title="Valor total" :value="formatCurrency(funnel.valorTotal)" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
      <StatCard title="Ponderado" :value="formatCurrency(funnel.ponderadoTotal)" icon="M13 10V3L4 14h7v7l9-11h-7z" color="purple" />
      <StatCard title="Ticket medio" :value="formatCurrency(funnel.ticketMedio)" icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" color="orange" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
      <div class="panel-flat p-6 lg:col-span-3">
        <h2 class="text-lg font-semibold">Importe por mes</h2>
        <p class="text-xs text-zinc-500 mb-3">Últimos 8 meses · el número es cantidad de negocios</p>
        <GraficaBarras :datos="mensual" color="#3b82f6" />
      </div>
      <div class="panel-flat p-6 lg:col-span-2">
        <h2 class="text-lg font-semibold mb-3">Reparto por etapa</h2>
        <GraficaDona :datos="(funnel.etapas || []).map(e => ({ etiqueta: e.nombre, count: e.count, color: e.color || '#3b82f6' }))" centro="negocios" />
      </div>
    </div>

    <div class="panel-flat p-6">
      <h2 class="text-lg font-semibold mb-4">Embudo por etapa</h2>
      <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
      <div v-else class="space-y-4">
        <div v-for="e in funnel.etapas || []" :key="e.stageId">
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="font-medium flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{ backgroundColor: e.color || '#3b82f6' }"></span>
              {{ e.nombre }}
            </span>
            <span class="flex flex-wrap items-center gap-1.5">
              <span class="inline-flex items-center rounded-full bg-zinc-200/70 dark:bg-white/10 px-2.5 py-0.5 text-xs font-medium tabular-nums">{{ e.count }} {{ e.count === 1 ? 'negocio' : 'negocios' }}</span>
              <span class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-400/15 px-2.5 py-0.5 text-xs font-medium tabular-nums text-green-700 dark:text-green-300">{{ formatCurrency(e.importe) }} total</span>
              <span class="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-400/15 px-2.5 py-0.5 text-xs font-medium tabular-nums text-blue-700 dark:text-blue-300">{{ formatCurrency(e.ponderado) }} ponderado</span>
            </span>
          </div>
          <div class="h-3 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
            <div class="h-full rounded-full transition-all" :style="{ width: pct(e.count) + '%', backgroundColor: e.color || '#3b82f6' }"></div>
          </div>
        </div>
        <div v-if="loading && !(funnel.etapas?.length)" class="py-2"><Skeleton :filas="4" /></div>
        <p v-if="!loading && !(funnel.etapas?.length)" class="text-sm text-zinc-500">Sin etapas.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Skeleton from '../components/Skeleton.vue'
import { formatCurrency, loadCurrency, currency } from '../utils/currency'
import StatCard from '../components/StatCard.vue'
import GraficaBarras from '../components/GraficaBarras.vue'
import GraficaDona from '../components/GraficaDona.vue'

const funnel = ref({ total: 0, valorTotal: 0, ponderadoTotal: 0, ticketMedio: 0, etapas: [] })
const pipelines = ref([])
const pipelineId = ref('')
const loading = ref(true)
const mensual = ref([])

const pct = (count) => {
  const max = Math.max(1, ...((funnel.value.etapas || []).map(e => e.count)))
  return Math.round((count / max) * 100)
}

const fetchFunnel = async () => {
  loading.value = true
  try {
    const params = pipelineId.value ? { pipelineId: pipelineId.value } : {}
    const [fr, mr] = await Promise.all([
      axios.get('/api/reportes/embudo', { params }),
      axios.get('/api/reportes/mensual', { params: { ...params, meses: 8 } }),
    ])
    funnel.value = fr.data
    mensual.value = (mr.data.serie || []).map(m => ({
      etiqueta: m.nombre,
      valor: m.importe,
      valorFmt: formatCurrency(m.importe),
      extra: `${m.count} negocios`,
      corto: m.count > 0 ? String(m.count) : '',
    }))
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
