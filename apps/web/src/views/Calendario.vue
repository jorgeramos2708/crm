<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <div class="flex gap-2">
        <button @click="rango = 7; fetchCal()" class="px-3 py-1.5 rounded-full text-xs border" :class="rango === 7 ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900' : 'border-zinc-300 dark:border-zinc-600'">7 días</button>
        <button @click="rango = 30; fetchCal()" class="px-3 py-1.5 rounded-full text-xs border" :class="rango === 30 ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900' : 'border-zinc-300 dark:border-zinc-600'">30 días</button>
      </div>
    </header>

    <div class="flex gap-2 mb-4 text-xs">
      <span v-if="fuentes.outlook?.connected" class="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Outlook conectado</span>
      <span v-else class="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500">Outlook: {{ fuentes.outlook?.error || 'no conectado' }}</span>
      <span v-if="fuentes.google?.connected" class="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Google conectado</span>
      <span v-else class="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500">Google: {{ fuentes.google?.error || 'no conectado' }}</span>
      <router-link to="/settings" class="underline text-zinc-500 ml-auto">Configurar conexiones</router-link>
    </div>

    <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="e in eventos" :key="e.provider + e.id" class="px-6 py-4 flex items-start gap-3">
          <span class="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0" :class="e.provider === 'outlook' ? 'bg-blue-500' : 'bg-red-500'"></span>
          <div class="min-w-0">
            <div class="font-medium text-sm">{{ e.subject }}</div>
            <div class="text-xs text-zinc-500">{{ fmtRango(e.start, e.end) }}{{ e.location ? ` · ${e.location}` : '' }}</div>
          </div>
          <a v-if="e.link" :href="e.link" target="_blank" class="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0">Abrir</a>
        </li>
        <li v-if="!eventos.length && !loading" class="px-6 py-12 text-center text-zinc-500 text-sm">Sin eventos en el rango.</li>
        <li v-if="loading" class="px-6 py-12 text-center text-zinc-500 text-sm">Cargando...</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const eventos = ref([])
const fuentes = ref({ outlook: {}, google: {} })
const rango = ref(7)
const loading = ref(true)

const fmtRango = (s, e) => {
  try {
    const f = (d) => new Date(d).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    return s ? `${f(s)}${e ? ' → ' + f(e) : ''}` : ''
  } catch { return '' }
}

const fetchCal = async () => {
  loading.value = true
  try {
    const end = new Date(Date.now() + rango.value * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await axios.get('/api/calendario', { params: { end } })
    eventos.value = data.data || []
    fuentes.value = data.fuentes || {}
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(fetchCal)
</script>
