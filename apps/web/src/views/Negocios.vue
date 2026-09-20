<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <input v-model="q" @input="fetchNegocios" type="text" placeholder="Buscar negocio..." class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm flex-1 min-w-[200px]" />
      <select v-model="stageId" @change="fetchNegocios" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todas las etapas</option>
        <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
      <select v-model="alcance" @change="fetchNegocios" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todos</option>
        <option value="mio">Míos</option>
        <option value="equipo">Mi equipo</option>
      </select>
      <a href="/api/oportunidades/export" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm">Exportar CSV</a>
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-700/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Negocio</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Etapa</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Importe</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Prob.</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <tr v-for="o in negocios" :key="o.id" class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
              <td class="px-6 py-4 text-sm font-medium">{{ o.nombre }}</td>
              <td class="px-6 py-4">
                <select :value="o.stageId" @change="cambiarEtapa(o, $event.target.value)" class="text-xs px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
                  <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.nombre }}</option>
                </select>
              </td>
              <td class="px-6 py-4 text-sm text-right tabular-nums">{{ formatCurrency(o.importe) }}</td>
              <td class="px-6 py-4 text-sm text-right tabular-nums">{{ o.probabilidad ?? 50 }}%</td>
              <td class="px-6 py-4 text-right text-sm">
                <button @click="eliminar(o)" class="text-red-600 hover:underline">Eliminar</button>
              </td>
            </tr>
            <tr v-if="!negocios.length">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-zinc-500">Sin negocios. Créalos desde el <router-link to="/pipeline" class="text-blue-600 hover:underline">Pipeline</router-link>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { formatCurrency, loadCurrency } from '../utils/currency'

const negocios = ref([])
const stages = ref([])
const q = ref('')
const stageId = ref('')
const alcance = ref('')

const fetchNegocios = async () => {
  try {
    const params = { limit: 100 }
    if (q.value) params.q = q.value
    if (stageId.value) params.stageId = stageId.value
    if (alcance.value) params.alcance = alcance.value
    const { data } = await axios.get('/api/oportunidades', { params })
    negocios.value = data.data || []
  } catch (e) { console.error(e) }
}

const cambiarEtapa = async (o, stage) => {
  try {
    await axios.put(`/api/oportunidades/${o.id}`, { stageId: stage })
    await fetchNegocios()
  } catch (e) { alert(e.response?.data?.error || 'Error cambiando etapa') }
}

const eliminar = async (o) => {
  if (!confirm(`¿Eliminar "${o.nombre}"?`)) return
  await axios.delete(`/api/oportunidades/${o.id}`)
  await fetchNegocios()
}

onMounted(async () => {
  await loadCurrency()
  try {
    const { data } = await axios.get('/api/pipeline-stages')
    stages.value = data.data || data
  } catch { /* */ }
  await fetchNegocios()
})
</script>
