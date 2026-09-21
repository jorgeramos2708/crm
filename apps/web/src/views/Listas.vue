<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nueva Lista</button>
    </header>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="lista in listas" :key="lista.id" class="panel-flat p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ lista.nombre }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ lista.descripcion || 'Sin descripción' }}</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          <span>{{ (lista.members || []).length }} contactos</span>
        </div>
        <div class="flex gap-2">
          <router-link :to="`/listas/${lista.id}`" class="flex-1 px-4 py-2 text-center bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:opacity-90 text-sm">Ver contactos</router-link>
          <button @click="openModal(lista)" class="px-4 py-2 text-center border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm">Editar</button>
          <button @click="eliminarLista(lista)" class="px-4 py-2 text-center text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">Eliminar</button>
        </div>
      </div>

      <div v-if="cargando && !listas.length" class="col-span-full panel-flat p-6"><Skeleton :filas="3" /></div>
      <div v-if="!cargando && listas.length === 0" class="col-span-full panel-flat p-12 text-center">
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">No hay listas creadas</p>
        <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg hover:opacity-90">Crear primera lista</button>
      </div>
    </div>

    <!-- Modal Lista (Crear/Editar) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">{{ editingLista ? 'Editar Lista' : 'Nueva Lista' }}</h2>
        <form @submit.prevent="guardarLista" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Nombre *</label>
            <input v-model="formData.nombre" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Descripción</label>
            <textarea v-model="formData.descripcion" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" rows="3"></textarea>
          </div>
          <div class="flex gap-2 pt-4">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">{{ saving ? (editingLista ? 'Guardando...' : 'Creando...') : (editingLista ? 'Guardar' : 'Crear') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Skeleton from '../components/Skeleton.vue'
import { toast } from '../utils/toast'
import { confirmar } from '../utils/confirm'

const listas = ref([])
const cargando = ref(true)
const showModal = ref(false)
const saving = ref(false)
const editingLista = ref(null)

const formData = ref({ nombre: '', descripcion: '' })

const fetchListas = async () => {
  try {
    const response = await axios.get('/api/contact-lists')
    listas.value = response.data.data || response.data
  } catch (e) {
    console.error('Error fetching listas:', e)
  } finally {
    cargando.value = false
  }
}

const openModal = (lista) => {
  editingLista.value = lista
  if (lista) {
    formData.value = { ...lista }
  } else {
    formData.value = { nombre: '', descripcion: '' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingLista.value = null
  formData.value = { nombre: '', descripcion: '' }
}

const guardarLista = async () => {
  if (!formData.value.nombre) {
    toast.error('El nombre es obligatorio')
    return
  }
  saving.value = true
  try {
    if (editingLista.value) {
      const response = await axios.put(`/api/contact-lists/${editingLista.value.id}`, formData.value)
      const idx = listas.value.findIndex(l => l.id === editingLista.value.id)
      if (idx !== -1) listas.value[idx] = response.data.data || response.data
    } else {
      const response = await axios.post('/api/contact-lists', formData.value)
      listas.value.unshift(response.data.data || response.data)
    }
    closeModal()
  } catch (e) {
    console.error('Error saving lista:', e)
    toast.error('Error al guardar lista')
  } finally {
    saving.value = false
  }
}

const eliminarLista = async (lista) => {
  if (!await confirmar(`¿Eliminar la lista "${lista.nombre}"?`)) return
  try {
    await axios.delete(`/api/contact-lists/${lista.id}`)
    listas.value = listas.value.filter(l => l.id !== lista.id)
  } catch (e) {
    console.error('Error deleting lista:', e)
    toast.error('Error al eliminar lista')
  }
}

onMounted(() => {
  fetchListas()
})
</script>