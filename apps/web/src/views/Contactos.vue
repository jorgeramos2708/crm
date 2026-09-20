<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <div class="flex gap-2">
        <a href="/api/contactos/export" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">Exportar CSV</a>
        <label class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer">
          Importar CSV
          <input type="file" accept=".csv" class="hidden" @change="importarCsv" />
        </label>
        <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nuevo Contacto</button>
      </div>
    </header>
    <p v-if="importMsg" class="mb-4 text-sm px-4 py-2 rounded-lg" :class="importOk ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'">{{ importMsg }}</p>
    <div class="mb-4">
      <VistasGuardadas entidad="contacto" :capturar="() => ({ sortBy: sortBy.value })" :aplicar="(f) => { if (f.sortBy) sortBy.value = f.sortBy; fetchContactos() }" />
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-700/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Teléfono</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Empresa</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cargo</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <tr v-for="contacto in contactos" :key="contacto.id" class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ contacto.nombre }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{{ contacto.email || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{{ contacto.telefono || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{{ contacto.empresa || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">{{ contacto.cargo || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openModal(contacto)" class="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3">Editar</button>
                <button @click="eliminarContacto(contacto)" class="text-red-600 hover:text-red-900 dark:hover:text-red-400">Eliminar</button>
              </td>
            </tr>
            <tr v-if="contactos.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">No hay contactos. <button @click="openModal(null)" class="text-blue-600 hover:underline">Crea el primero</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div class="text-sm text-zinc-500 dark:text-zinc-400">
          Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, total) }} de {{ total }} contactos
        </div>
      <div class="flex gap-2 items-center">
        <select v-model="sortBy" @change="fetchContactos" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
          <option value="createdAt">Recientes</option>
          <option value="nombre">Nombre</option>
          <option value="email">Email</option>
        </select>
          <button @click="prevPage" :disabled="currentPage === 1" class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Anterior</button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- Modal Contacto (Crear/Editar) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">{{ editingContacto ? 'Editar Contacto' : 'Nuevo Contacto' }}</h2>
        <form @submit.prevent="guardarContacto" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Nombre *</label>
            <input v-model="formData.nombre" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Email</label>
            <input v-model="formData.email" type="email" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Teléfono</label>
            <input v-model="formData.telefono" type="text" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Empresa</label>
            <input v-model="formData.empresa" type="text" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Cargo</label>
            <input v-model="formData.cargo" type="text" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <CustomFields entidad="contacto" v-model="formData.custom" />
          <div class="flex gap-2 pt-4">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">{{ saving ? (editingContacto ? 'Guardando...' : 'Creando...') : (editingContacto ? 'Guardar' : 'Crear') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import CustomFields from '../components/CustomFields.vue'
import VistasGuardadas from '../components/VistasGuardadas.vue'

const contactos = ref([])
const cargando = ref(true)
const showModal = ref(false)
const saving = ref(false)
const editingContacto = ref(null)

const formData = ref({ nombre: '', email: '', telefono: '', empresa: '', cargo: '', custom: {} })

// Pagination
const currentPage = ref(1)
const pageSize = 20
const total = ref(0)
const totalPages = ref(1)
const sortBy = ref('createdAt')

const fetchContactos = async () => {
  cargando.value = true
  try {
    const response = await axios.get('/api/contactos', {
      params: { limit: pageSize, offset: (currentPage.value - 1) * pageSize, sortBy: sortBy.value }
    })
    const data = response.data.data || response.data
    contactos.value = data
    total.value = response.data.total || data.length
    totalPages.value = Math.ceil(total.value / pageSize)
  } catch (e) {
    console.error('Error fetching contactos:', e)
  } finally {
    cargando.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchContactos()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchContactos()
  }
}

const openModal = (contacto) => {
  editingContacto.value = contacto
  if (contacto) {
    formData.value = { ...contacto, custom: { ...(contacto.custom || {}) } }
  } else {
    formData.value = { nombre: '', email: '', telefono: '', empresa: '', cargo: '', custom: {} }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingContacto.value = null
  formData.value = { nombre: '', email: '', telefono: '', empresa: '', cargo: '', custom: {} }
}

const guardarContacto = async () => {
  if (!formData.value.nombre) {
    alert('El nombre es obligatorio')
    return
  }
  saving.value = true
  try {
    if (editingContacto.value) {
      const response = await axios.put(`/api/contactos/${editingContacto.value.id}`, formData.value)
      const idx = contactos.value.findIndex(c => c.id === editingContacto.value.id)
      if (idx !== -1) contactos.value[idx] = response.data.data || response.data
    } else {
      const response = await axios.post('/api/contactos', formData.value)
      contactos.value.unshift(response.data.data || response.data)
    }
    closeModal()
    fetchContactos() // Refresh to get correct pagination
  } catch (e) {
    console.error('Error saving contacto:', e)
    alert('Error al guardar contacto')
  } finally {
    saving.value = false
  }
}

const importMsg = ref('')
const importOk = ref(false)

const importarCsv = async (ev) => {
  const file = ev.target.files?.[0]
  if (!file) return
  importMsg.value = ''
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await axios.post('/api/contactos/import', form)
    importOk.value = true
    importMsg.value = `Importados: ${data.created} creados, ${data.updated} actualizados` +
      (data.totalErrors ? `. ${data.totalErrors} errores (${(data.errors || []).slice(0, 3).join(' | ')})` : '')
    fetchContactos()
  } catch (e) {
    importOk.value = false
    importMsg.value = e.response?.data?.error || 'Error importando CSV'
  } finally {
    ev.target.value = ''
  }
}

const eliminarContacto = async (contacto) => {
  if (!confirm(`¿Eliminar a ${contacto.nombre}?`)) return
  try {
    await axios.delete(`/api/contactos/${contacto.id}`)
    fetchContactos() // Refresh to get correct pagination
  } catch (e) {
    console.error('Error deleting contacto:', e)
    if (!e.response) {
      alert('Sin conexión con el servidor (revisa que el API esté arriba) e inténtalo de nuevo')
    } else {
      alert(e.response?.data?.error || 'Error al eliminar contacto')
    }
  }
}

onMounted(() => {
  fetchContactos()
})
</script>