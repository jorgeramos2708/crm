<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
    <header class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <p class="text-sm text-zinc-500">{{ total }} oportunidades</p>
        <select v-model="alcance" @change="fetchData" class="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
          <option value="">Todas</option>
          <option value="mio">Mías</option>
          <option value="equipo">Mi equipo</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button @click="showNewOportunidad = true" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nueva Oportunidad</button>
        <a href="/api/oportunidades/export" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">Exportar CSV</a>
      </div>
    </header>
    <div class="flex gap-4 overflow-x-auto pb-8" style="min-width: 100%">
      <div v-for="stage in stages" :key="stage.id" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 min-w-[280px] flex-shrink-0 flex flex-col" :style="{ borderTopColor: stage.color || '#3b82f6', minHeight: '500px' }">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stage.color || '#3b82f6' }"></div><h3 class="text-lg font-medium text-zinc-900 dark:text-zinc-400">{{ stage.nombre }}</h3></div>
          <span class="text-sm text-zinc-500">{{ (oportunidadesPorStage[stage.id] || []).length }} oportunidades</span>
        </div>
        <div class="space-y-2 flex-1 overflow-y-auto" @dragover.prevent="onDragOver(stage.id)" @drop="onDrop(stage.id)">
          <div v-for="opp in oportunidadesPorStage[stage.id] || []" :key="opp.id" 
               class="p-3 rounded-md bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 mb-2 cursor-grab"
               draggable="true"
               @dragstart="onDragStart(opp)"
               @dragend="onDragEnd">
            <div class="font-medium text-zinc-900 dark:text-zinc-300 truncate max-w-xs">{{ opp.nombre }}</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">{{ formatCurrency(opp.importe) }}</div>
          </div>
          <div v-if="(oportunidadesPorStage[stage.id] || []).length === 0" class="p-4 text-center text-zinc-400 dark:text-zinc-600"><p>No hay oportunidades</p></div>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Oportunidad -->
    <div v-if="showNewOportunidad" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Nueva Oportunidad</h2>
        <form @submit.prevent="crearOportunidad" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Pipeline</label>
            <select v-model="nuevaOportunidad.pipelineId" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" required>
              <option value="">Seleccionar pipeline</option>
              <option v-for="p in pipelines" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Etapa</label>
            <select v-model="nuevaOportunidad.stageId" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" required>
              <option value="">Seleccionar etapa</option>
              <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Nombre</label>
            <input v-model="nuevaOportunidad.nombre" type="text" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" required />
          </div>
          <div>
            <label class="block text-sm mb-1">Importe</label>
            <input v-model.number="nuevaOportunidad.importe" type="number" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Descripción</label>
            <textarea v-model="nuevaOportunidad.descripcion" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" rows="3"></textarea>
          </div>
          <CustomFields entidad="oportunidad" v-model="nuevaOportunidad.custom" />
          <div class="flex gap-2 pt-4">
            <button type="button" @click="showNewOportunidad = false" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" :disabled="creando" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">{{ creando ? 'Creando...' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { formatCurrency, loadCurrency } from '../utils/currency'
import CustomFields from '../components/CustomFields.vue'

const router = useRouter()
const authStore = useAuthStore()

const stages = ref([])
const oportunidades = ref([])
const pipelines = ref([])
const cargando = ref(true)
const showNewOportunidad = ref(false)
const creando = ref(false)

const nuevaOportunidad = ref({ nombre: '', pipelineId: '', stageId: '', importe: 0, descripcion: '', custom: {} })

const oportunidadesPorStage = computed(() => {
  const grouped = {}
  stages.value.forEach(s => grouped[s.id] = [])
  oportunidades.value.forEach(o => {
    if (grouped[o.stageId]) grouped[o.stageId].push(o)
  })
  return grouped
})

const total = computed(() => oportunidades.value.length)

const draggedOportunidad = ref(null)

const alcance = ref('')

const fetchData = async () => {
  try {
    const [stagesRes, oppsRes, pipelinesRes] = await Promise.all([
      axios.get('/api/pipeline-stages'),
      axios.get('/api/oportunidades', { params: alcance.value ? { alcance: alcance.value, limit: 200 } : { limit: 200 } }),
      axios.get('/api/pipelines')
    ])
    stages.value = stagesRes.data.data || stagesRes.data
    oportunidades.value = oppsRes.data.data || oppsRes.data
    pipelines.value = pipelinesRes.data.data || pipelinesRes.data
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    cargando.value = false
  }
}

const crearOportunidad = async () => {
  if (!nuevaOportunidad.value.nombre || !nuevaOportunidad.value.pipelineId || !nuevaOportunidad.value.stageId) {
    alert('Complete los campos obligatorios')
    return
  }
  creando.value = true
  try {
    const response = await axios.post('/api/oportunidades', nuevaOportunidad.value)
    oportunidades.value.push(response.data.data || response.data)
    showNewOportunidad.value = false
    nuevaOportunidad.value = { nombre: '', pipelineId: '', stageId: '', importe: 0, descripcion: '', custom: {} }
  } catch (e) {
    console.error('Error creating oportunidad:', e)
    alert('Error al crear oportunidad')
  } finally {
    creando.value = false
  }
}

const onDragStart = (opp) => {
  draggedOportunidad.value = opp
}

const onDragEnd = () => {
  draggedOportunidad.value = null
}

const onDragOver = (e) => {
  e.preventDefault()
}

const onDrop = async (stageId) => {
  if (!draggedOportunidad.value || draggedOportunidad.value.stageId === stageId) {
    draggedOportunidad.value = null
    return
  }
  try {
    await axios.put(`/api/oportunidades/${draggedOportunidad.value.id}`, { stageId })
    draggedOportunidad.value.stageId = stageId
    draggedOportunidad.value = null
  } catch (e) {
    console.error('Error moving oportunidad:', e)
    alert('Error al mover la oportunidad')
  }
}

onMounted(async () => {
  await loadCurrency()
  await fetchData()
})
</script>

<style scoped>
[draggable="true"] { cursor: grab; }
[draggable="true"]:active { cursor: grabbing; }
</style>