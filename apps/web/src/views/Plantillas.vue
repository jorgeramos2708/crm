<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nueva Plantilla</button>
    </header>

    <div class="space-y-4">
      <div v-for="tpl in plantillas" :key="tpl.id" class="panel-flat p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ tpl.nombre }}</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Asunto: {{ tpl.asunto }}</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="v in tpl.variables" :key="v" class="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-full text-xs">{{ v }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openModal(tpl)" class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm">Editar</button>
            <button @click="eliminarTemplate(tpl)" class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:opacity-90 text-sm">Eliminar</button>
          </div>
        </div>
      </div>

      <div v-if="cargando && !plantillas.length" class="panel-flat p-6"><Skeleton :filas="3" /></div>
      <div v-if="!cargando && plantillas.length === 0" class="panel-flat p-12 text-center">
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">No hay plantillas creadas</p>
        <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg hover:opacity-90">Crear primera plantilla</button>
      </div>
    </div>

    <!-- Modal Plantilla (Crear/Editar) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla' }}</h2>
        <form @submit.prevent="guardarTemplate" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Nombre *</label>
            <input v-model="formData.nombre" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Asunto *</label>
            <input v-model="formData.asunto" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Contenido *</label>
            <textarea v-model="formData.contenidoTexto" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" rows="8"></textarea>
            <p class="text-xs text-zinc-500 mt-1">Usa {{ variable }} para variables dinámicas. Se convierte a email con formato automáticamente.</p>
          </div>
          <div>
            <label class="block text-sm mb-1">Variables (separadas por coma)</label>
            <input v-model="variablesInput" type="text" placeholder="nombre, empresa, importe" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">{{ saving ? (editingTemplate ? 'Guardando...' : 'Creando...') : (editingTemplate ? 'Guardar' : 'Crear') }}</button>
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

const plantillas = ref([])
const cargando = ref(true)
const showModal = ref(false)
const saving = ref(false)
const editingTemplate = ref(null)

const variablesInput = ref('')

const formData = ref({
  nombre: '',
  asunto: '',
  contenidoHtml: '',
  contenidoTexto: '',
  variables: []
})

const fetchTemplates = async () => {
  try {
    const response = await axios.get('/api/email-templates')
    plantillas.value = response.data.data || response.data
  } catch (e) {
    console.error('Error fetching templates:', e)
  } finally {
    cargando.value = false
  }
}

const openModal = (tpl) => {
  editingTemplate.value = tpl
  if (tpl) {
    formData.value = { ...tpl }
    variablesInput.value = tpl.variables?.join(', ') || ''
  } else {
    formData.value = { nombre: '', asunto: '', contenidoHtml: '', contenidoTexto: '', variables: [] }
    variablesInput.value = ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingTemplate.value = null
  formData.value = { nombre: '', asunto: '', contenidoHtml: '', contenidoTexto: '', variables: [] }
  variablesInput.value = ''
}

const textoAHtml = (texto) => {
  const esc = String(texto || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div>${esc.split('\n').join('<br>')}</div>`
}

const guardarTemplate = async () => {
  if (!formData.value.nombre || !formData.value.asunto || !formData.value.contenidoTexto) {
    toast.error('Nombre, asunto y contenido son obligatorios')
    return
  }
  saving.value = true
  try {
    const payload = {
      ...formData.value,
      contenidoHtml: textoAHtml(formData.value.contenidoTexto),
      variables: variablesInput.value.split(',').map(v => v.trim()).filter(Boolean)
    }
    if (editingTemplate.value) {
      const response = await axios.put(`/api/email-templates/${editingTemplate.value.id}`, payload)
      const idx = plantillas.value.findIndex(t => t.id === editingTemplate.value.id)
      if (idx !== -1) plantillas.value[idx] = response.data.data || response.data
    } else {
      const response = await axios.post('/api/email-templates', payload)
      plantillas.value.unshift(response.data.data || response.data)
    }
    closeModal()
  } catch (e) {
    console.error('Error saving template:', e)
    toast.error('Error al guardar plantilla')
  } finally {
    saving.value = false
  }
}

const eliminarTemplate = async (tpl) => {
  if (!await confirmar(`¿Eliminar la plantilla "${tpl.nombre}"?`)) return
  try {
    await axios.delete(`/api/email-templates/${tpl.id}`)
    plantillas.value = plantillas.value.filter(t => t.id !== tpl.id)
  } catch (e) {
    console.error('Error deleting template:', e)
    toast.error('Error al eliminar plantilla')
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>