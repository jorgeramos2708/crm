<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nueva Campaña</button>
    </header>

    <div class="space-y-4">
      <div v-for="campaign in campanas" :key="campaign.id" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{{ campaign.nombre }}</h3>
              <span :class="getEstadoClass(campaign.estado)" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ campaign.estado }}
              </span>
            </div>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Asunto: {{ campaign.asunto }}</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">De: {{ campaign.remitenteNombre }} <{{ campaign.remitenteEmail }}></p>
            <div class="flex gap-4 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span>Plantilla: {{ campaign.templateId || 'N/A' }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button v-if="campaign.estado === 'borrador'" @click="enviarCampana(campaign.id)" class="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:opacity-90 text-sm">Enviar</button>
            <button @click="openModal(campaign)" class="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 text-sm">Editar</button>
            <button @click="eliminarCampana(campaign)" class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:opacity-90 text-sm">Eliminar</button>
          </div>
        </div>
      </div>

      <div v-if="campanas.length === 0" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-12 text-center">
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">No hay campañas creadas</p>
        <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg hover:opacity-90">Crear primera campaña</button>
      </div>
    </div>

    <!-- Modal Campaña (Crear/Editar) -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ editingCampaign ? 'Editar Campaña' : 'Nueva Campaña' }}</h2>
        <form @submit.prevent="guardarCampana" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Nombre *</label>
            <input v-model="formData.nombre" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm mb-1">Remitente Nombre *</label>
              <input v-model="formData.remitenteNombre" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
            </div>
            <div>
              <label class="block text-sm mb-1">Remitente Email *</label>
              <input v-model="formData.remitenteEmail" type="email" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">Asunto *</label>
            <input v-model="formData.asunto" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
          </div>
          <div>
            <label class="block text-sm mb-1">Plantilla *</label>
            <select v-model="formData.templateId" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" required>
              <option value="">Seleccionar plantilla</option>
              <option v-for="t in plantillas" :key="t.id" :value="t.id">{{ t.nombre }} ({{ t.asunto }})</option>
            </select>
          </div>
          <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" :disabled="saving" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">{{ saving ? (editingCampaign ? 'Guardando...' : 'Creando...') : (editingCampaign ? 'Guardar' : 'Crear') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const campanas = ref([])
const plantillas = ref([])
const cargando = ref(true)
const showModal = ref(false)
const saving = ref(false)
const editingCampaign = ref(null)

const formData = ref({
  nombre: '',
  templateId: '',
  remitenteNombre: '',
  remitenteEmail: '',
  asunto: '',
  estado: 'borrador'
})

const fetchData = async () => {
  try {
    const [campanasRes, plantillasRes] = await Promise.all([
      axios.get('/api/email-campaigns'),
      axios.get('/api/email-templates')
    ])
    campanas.value = campanasRes.data.data || campanasRes.data
    plantillas.value = plantillasRes.data.data || plantillasRes.data
  } catch (e) {
    console.error('Error fetching data:', e)
  } finally {
    cargando.value = false
  }
}

const getEstadoClass = (estado) => {
  const classes = {
    borrador: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
    enviada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    programada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    enviando: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
  return `px-2 py-1 rounded-full text-xs font-medium ${classes[estado] || classes.borrador}`
}

const openModal = (campaign) => {
  editingCampaign.value = campaign
  if (campaign) {
    formData.value = { ...campaign }
  } else {
    formData.value = { nombre: '', templateId: '', remitenteNombre: '', remitenteEmail: '', asunto: '', estado: 'borrador' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCampaign.value = null
  formData.value = { nombre: '', templateId: '', remitenteNombre: '', remitenteEmail: '', asunto: '', estado: 'borrador' }
}

const guardarCampana = async () => {
  if (!formData.value.nombre || !formData.value.templateId || !formData.value.remitenteNombre || !formData.value.remitenteEmail || !formData.value.asunto) {
    alert('Todos los campos son obligatorios')
    return
  }
  saving.value = true
  try {
    if (editingCampaign.value) {
      const response = await axios.put(`/api/email-campaigns/${editingCampaign.value.id}`, formData.value)
      const idx = campanas.value.findIndex(c => c.id === editingCampaign.value.id)
      if (idx !== -1) campanas.value[idx] = response.data.data || response.data
    } else {
      const response = await axios.post('/api/email-campaigns', formData.value)
      campanas.value.unshift(response.data.data || response.data)
    }
    closeModal()
  } catch (e) {
    console.error('Error saving campaign:', e)
    alert('Error al guardar campaña')
  } finally {
    saving.value = false
  }
}

const eliminarCampana = async (campaign) => {
  if (!confirm(`¿Eliminar la campaña "${campaign.nombre}"?`)) return
  try {
    await axios.delete(`/api/email-campaigns/${campaign.id}`)
    campanas.value = campanas.value.filter(c => c.id !== campaign.id)
  } catch (e) {
    console.error('Error deleting campaign:', e)
    alert('Error al eliminar campaña')
  }
}

const enviarCampana = async (id) => {
  if (!confirm('¿Enviar esta campaña a todos los contactos?')) return
  try {
    await axios.post(`/api/email-campaigns/${id}/send`)
    const campana = campanas.value.find(c => c.id === id)
    if (campana) campana.estado = 'enviada'
    alert('Campaña enviada')
  } catch (e) {
    console.error('Error sending campaign:', e)
    alert('Error al enviar campaña')
  }
}

onMounted(() => {
  fetchData()
})
</script>