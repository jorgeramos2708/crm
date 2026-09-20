<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nueva Tarea</button>
    </header>

    <div class="flex flex-wrap gap-2 mb-4">
      <select v-model="filtros.estado" @change="fetchTareas" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="en_progreso">En progreso</option>
        <option value="completada">Completada</option>
        <option value="cancelada">Cancelada</option>
      </select>
      <select v-model="filtros.sortBy" @change="fetchTareas" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="createdAt">Recientes</option>
        <option value="vencimiento">Vencimiento</option>
        <option value="titulo">Título</option>
        <option value="estado">Estado</option>
      </select>
      <button @click="toggleDir" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm">{{ filtros.sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}</button>
      <VistasGuardadas entidad="tarea" :capturar="() => ({ ...filtros.value })" :aplicar="(f) => { filtros.value = { estado: '', sortBy: 'createdAt', sortDir: 'desc', alcance: '', ...f }; fetchTareas() }" />
      <select v-model="filtros.alcance" @change="fetchTareas" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todas</option>
        <option value="mio">Mías</option>
        <option value="equipo">Mi equipo</option>
      </select>
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="t in tareas" :key="t.id" class="px-6 py-4 flex items-start gap-3">
          <input type="checkbox" :checked="t.estado === 'completada'" @change="toggleEstado(t)" class="mt-1 w-4 h-4" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm" :class="{ 'line-through text-zinc-400': t.estado === 'completada' }">{{ t.titulo }}</div>
            <div class="text-xs text-zinc-500 mt-0.5">
              {{ estadoLabel(t.estado) }} · Prioridad {{ t.prioridad }}{{ t.vencimiento ? ` · Vence ${formatDate(t.vencimiento)}` : '' }}{{ t._vinculo ? ` · ${t._vinculo}` : '' }}
            </div>
            <p v-if="t.descripcion" class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{{ t.descripcion }}</p>
          </div>
          <div class="flex gap-2 text-xs">
            <button @click="openModal(t)" class="text-blue-600 hover:underline">Editar</button>
            <button @click="eliminar(t)" class="text-red-600 hover:underline">Eliminar</button>
          </div>
        </li>
        <li v-if="!tareas.length" class="px-6 py-12 text-center text-zinc-500 text-sm">Sin tareas.</li>
      </ul>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ editing ? 'Editar Tarea' : 'Nueva Tarea' }}</h2>
        <form @submit.prevent="guardar" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Título *</label>
            <input v-model="form.titulo" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Descripción</label>
            <textarea v-model="form.descripcion" rows="3" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1">Estado</label>
              <select v-model="form.estado" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Prioridad</label>
              <select v-model="form.prioridad" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">Vencimiento</label>
            <input v-model="form.vencimiento" type="date" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1">Vincular a</label>
              <select v-model="form.entityType" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
                <option value="">Sin vínculo</option>
                <option value="contacto">Contacto</option>
                <option value="empresa">Empresa</option>
                <option value="oportunidad">Oportunidad</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Registro</label>
              <select v-model="form.entityId" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
                <option value="">—</option>
                <option v-for="r in vinculos" :key="r.id" :value="r.id">{{ r.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import VistasGuardadas from '../components/VistasGuardadas.vue'

const tareas = ref([])
const contactos = ref([])
const empresas = ref([])
const oportunidades = ref([])
const showModal = ref(false)
const editing = ref(null)
const filtros = ref({ estado: '', sortBy: 'createdAt', sortDir: 'desc', alcance: '' })
const form = ref({ titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', vencimiento: '', entityType: '', entityId: '' })

const vinculos = computed(() => {
  if (form.value.entityType === 'contacto') return contactos.value
  if (form.value.entityType === 'empresa') return empresas.value
  if (form.value.entityType === 'oportunidad') return oportunidades.value
  return []
})

const estadoLabel = (e) => ({ pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada', cancelada: 'Cancelada' }[e] || e)
const formatDate = (d) => { try { return new Date(d).toLocaleDateString() } catch { return '' } }

const fetchTareas = async () => {
  try {
    const { data } = await axios.get('/api/tareas', { params: { limit: 100, ...filtros.value } })
    const nombres = {}
    ;[...contactos.value, ...empresas.value, ...oportunidades.value].forEach(r => { nombres[r.id] = r.nombre })
    tareas.value = (data.data || []).map(t => ({ ...t, _vinculo: t.entityId ? (nombres[t.entityId] || t.entityType) : '' }))
  } catch (e) { console.error(e) }
}

const toggleDir = () => {
  filtros.value.sortDir = filtros.value.sortDir === 'asc' ? 'desc' : 'asc'
  fetchTareas()
}

const openModal = (t) => {
  editing.value = t
  form.value = t
    ? { titulo: t.titulo, descripcion: t.descripcion || '', estado: t.estado, prioridad: t.prioridad, vencimiento: t.vencimiento ? t.vencimiento.slice(0, 10) : '', entityType: t.entityType || '', entityId: t.entityId || '' }
    : { titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', vencimiento: '', entityType: '', entityId: '' }
  showModal.value = true
}

const guardar = async () => {
  const payload = { ...form.value }
  if (!payload.entityType) { payload.entityType = null; payload.entityId = null }
  if (!payload.vencimiento) payload.vencimiento = null
  if (editing.value) await axios.put(`/api/tareas/${editing.value.id}`, payload)
  else await axios.post('/api/tareas', payload)
  showModal.value = false
  await fetchTareas()
}

const toggleEstado = async (t) => {
  await axios.put(`/api/tareas/${t.id}`, { estado: t.estado === 'completada' ? 'pendiente' : 'completada' })
  await fetchTareas()
}

const eliminar = async (t) => {
  if (!confirm(`¿Eliminar "${t.titulo}"?`)) return
  await axios.delete(`/api/tareas/${t.id}`)
  await fetchTareas()
}

watch(() => form.value.entityType, () => { form.value.entityId = '' })

onMounted(async () => {
  try {
    const [c, e, o] = await Promise.all([
      axios.get('/api/contactos', { params: { limit: 200 } }),
      axios.get('/api/companies', { params: { limit: 200 } }),
      axios.get('/api/oportunidades', { params: { limit: 200 } }),
    ])
    contactos.value = c.data.data || []
    empresas.value = e.data.data || []
    oportunidades.value = o.data.data || []
  } catch { /* */ }
  await fetchTareas()
})
</script>
