<template>
  <div class="flex flex-wrap items-center gap-2">
    <select v-model="sel" @change="aplicarSel" class="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
      <option value="">Vistas guardadas...</option>
      <option v-for="v in vistas" :key="v.id" :value="v.id">{{ v.nombre }}</option>
    </select>
    <button v-if="sel" @click="borrarSel" class="text-red-600 hover:underline text-xs">Eliminar vista</button>
    <div class="flex gap-1">
      <input v-model="nombre" type="text" placeholder="Guardar vista actual como..." class="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
      <button @click="guardar" :disabled="!nombre" class="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm disabled:opacity-50">Guardar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  entidad: { type: String, required: true },
  capturar: { type: Function, required: true },
  aplicar: { type: Function, required: true },
})

const vistas = ref([])
const sel = ref('')
const nombre = ref('')

const fetchVistas = async () => {
  try {
    const { data } = await axios.get('/api/vistas', { params: { entidad: props.entidad } })
    vistas.value = data || []
  } catch { vistas.value = [] }
}

const guardar = async () => {
  await axios.post('/api/vistas', { entidad: props.entidad, nombre: nombre.value, filtros: props.capturar() })
  nombre.value = ''
  await fetchVistas()
}

const aplicarSel = () => {
  const v = vistas.value.find(x => x.id === sel.value)
  if (v) props.aplicar(v.filtros || {})
}

const borrarSel = async () => {
  if (!sel.value || !confirm('¿Eliminar esta vista?')) return
  await axios.delete(`/api/vistas/${sel.value}`)
  sel.value = ''
  await fetchVistas()
}

onMounted(fetchVistas)
</script>
