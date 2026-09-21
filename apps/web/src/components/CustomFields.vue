<template>
  <div v-if="fields.length" class="space-y-4">
    <div v-for="f in fields" :key="f.id">
      <label class="block text-sm mb-1">{{ f.etiqueta }}{{ f.requerido ? ' *' : '' }}</label>
      <input v-if="f.tipo === 'texto' || f.tipo === 'numero'" v-model="model[f.clave]" :type="f.tipo === 'numero' ? 'number' : 'text'" :required="f.requerido" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
      <FechaInput v-else-if="f.tipo === 'fecha'" v-model="model[f.clave]" :required="f.requerido" />
      <label v-else-if="f.tipo === 'booleano'" class="flex items-center gap-2 cursor-pointer text-sm">
        <input v-model="model[f.clave]" type="checkbox" class="w-4 h-4" /> {{ f.etiqueta }}
      </label>
      <select v-else-if="f.tipo === 'seleccion'" v-model="model[f.clave]" :required="f.requerido" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700">
        <option value="">Seleccionar...</option>
        <option v-for="op in (f.opciones || [])" :key="op" :value="op">{{ op }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import FechaInput from './FechaInput.vue'

const props = defineProps({
  entidad: { type: String, required: true },
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const fields = ref([])
const model = ref({ ...(props.modelValue || {}) })

watch(model, (v) => emit('update:modelValue', { ...v }), { deep: true })
watch(() => props.modelValue, (v) => { model.value = { ...(v || {}) } })

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/custom-fields', { params: { entidad: props.entidad } })
    fields.value = data || []
  } catch { /* */ }
})
</script>
