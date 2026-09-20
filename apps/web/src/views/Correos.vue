<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <button @click="showSend = !showSend" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">✉️ Redactar</button>
    </header>

    <div class="flex gap-2 mb-4">
      <button @click="provider = 'microsoft'; fetchEmails()" class="px-4 py-2 rounded-full text-sm border" :class="provider === 'microsoft' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900' : 'border-zinc-300 dark:border-zinc-600'">Outlook</button>
      <button @click="provider = 'google'; fetchEmails()" class="px-4 py-2 rounded-full text-sm border" :class="provider === 'google' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900' : 'border-zinc-300 dark:border-zinc-600'">Gmail</button>
    </div>

    <div v-if="!curStatus?.connected" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm mb-4">
      {{ provider === 'microsoft' ? 'Outlook' : 'Gmail' }} no conectado. <router-link to="/settings" class="underline font-medium">Conéctalo en Configuración</router-link>
    </div>

    <!-- Redactar -->
    <section v-if="showSend" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="font-semibold mb-4">Nuevo correo (vía {{ provider === 'microsoft' ? 'Outlook' : 'Gmail' }})</h2>
      <form @submit.prevent="enviar" class="space-y-3">
        <input v-model="send.to" type="text" required placeholder="Para (separa con comas)" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <input v-model="send.subject" type="text" required placeholder="Asunto" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <textarea v-model="send.body" rows="5" required placeholder="Mensaje..." class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"></textarea>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select v-model="send.contactoId" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
            <option value="">Vincular a contacto (opcional)...</option>
            <option v-for="c in contactos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <select v-model="send.oportunidadId" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
            <option value="">Vincular a oportunidad (opcional)...</option>
            <option v-for="o in oportunidades" :key="o.id" :value="o.id">{{ o.nombre }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button type="submit" :disabled="sending" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{{ sending ? 'Enviando...' : 'Enviar' }}</button>
          <span v-if="sendMsg" class="text-sm text-zinc-500">{{ sendMsg }}</span>
        </div>
      </form>
    </section>

    <!-- Bandeja -->
    <section class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
        <select v-if="provider === 'microsoft'" v-model="folder" @change="fetchEmails" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
          <option value="inbox">Recibidos</option>
          <option value="sentitems">Enviados</option>
          <option value="drafts">Borradores</option>
        </select>
        <input v-else v-model="gQuery" @keyup.enter="fetchEmails" type="text" placeholder="Buscar en Gmail..." class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm flex-1" />
        <button @click="fetchEmails" :disabled="loading" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50">{{ loading ? 'Cargando...' : 'Actualizar' }}</button>
        <span v-if="live" class="ml-auto inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300"><span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>En vivo</span>
      </div>
      <p v-if="mailError" class="px-6 py-3 text-sm text-red-600">{{ mailError }}</p>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="m in emails" :key="m.id" class="px-6 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{{ m.subject || '(sin asunto)' }}</div>
              <div class="text-xs text-zinc-500">{{ m.from?.emailAddress?.name || m.from?.emailAddress?.address || '' }} {{ m.from?.emailAddress?.address ? `&lt;${m.from.emailAddress.address}&gt;` : '' }} · {{ formatDate(m.receivedDateTime || m.sentDateTime) }}</div>
              <div class="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{{ m.bodyPreview }}</div>
            </div>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <select v-model="linkSel[m.id]" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs">
              <option value="">Vincular a...</option>
              <optgroup label="Contactos">
                <option v-for="c in contactos" :key="'c'+c.id" :value="'c:'+c.id">{{ c.nombre }}</option>
              </optgroup>
              <optgroup label="Oportunidades">
                <option v-for="o in oportunidades" :key="'o'+o.id" :value="'o:'+o.id">{{ o.nombre }}</option>
              </optgroup>
            </select>
            <button @click="vincular(m)" :disabled="!linkSel[m.id]" class="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50">Vincular</button>
            <span v-if="linkMsg[m.id]" class="text-xs text-zinc-500">{{ linkMsg[m.id] }}</span>
          </div>
        </li>
        <li v-if="!emails.length && !loading" class="px-6 py-12 text-center text-zinc-500 text-sm">Sin correos en esta carpeta.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

const live = ref(false)
let es = null

const connectStream = () => {
  try {
    es = new EventSource('/api/stream', { withCredentials: true })
    es.onopen = () => { live.value = true }
    es.onerror = () => { live.value = false }
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'mail.received') fetchEmails()
      } catch { /* heartbeat u otro evento */ }
    }
  } catch { /* SSE no disponible: queda el botón Actualizar */ }
}

const provider = ref('microsoft')
const msStatus = ref(null)
const gStatus = ref(null)
const curStatus = computed(() => provider.value === 'microsoft' ? msStatus.value : gStatus.value)
const emails = ref([])
const contactos = ref([])
const oportunidades = ref([])
const folder = ref('inbox')
const gQuery = ref('')
const loading = ref(false)
const mailError = ref('')
const showSend = ref(false)
const send = ref({ to: '', subject: '', body: '', contactoId: '', oportunidadId: '' })
const sending = ref(false)
const sendMsg = ref('')
const linkSel = reactive({})
const linkMsg = reactive({})

const formatDate = (d) => { try { return d ? new Date(d).toLocaleString() : '' } catch { return '' } }

const fetchEmails = async () => {
  loading.value = true
  mailError.value = ''
  try {
    const { data } = provider.value === 'microsoft'
      ? await axios.get('/api/microsoft/emails', { params: { folder: folder.value, top: 25 } })
      : await axios.get('/api/google/emails', { params: { q: gQuery.value || undefined, max: 25 } })
    emails.value = data.data || []
  } catch (e) {
    mailError.value = e.response?.data?.error || 'No se pudieron cargar los correos'
  } finally { loading.value = false }
}

const enviar = async () => {
  sending.value = true
  sendMsg.value = ''
  try {
    await axios.post(`/api/${provider.value}/send`, {
      to: send.value.to.split(',').map(s => s.trim()).filter(Boolean),
      subject: send.value.subject,
      htmlBody: `<p>${send.value.body.replace(/\n/g, '<br>')}</p>`,
      contactoId: send.value.contactoId || undefined,
      oportunidadId: send.value.oportunidadId || undefined
    })
    sendMsg.value = 'Enviado y vinculado'
    send.value = { to: '', subject: '', body: '', contactoId: '', oportunidadId: '' }
  } catch (e) {
    sendMsg.value = e.response?.data?.error || 'Error enviando'
  } finally { sending.value = false }
}

const vincular = async (m) => {
  const sel = linkSel[m.id]
  if (!sel) return
  const [kind, id] = sel.split(':')
  try {
    await axios.post('/api/microsoft/vincular', {
      messageId: m.id,
      asunto: m.subject,
      from: m.from?.emailAddress?.address,
      contactoId: kind === 'c' ? id : undefined,
      oportunidadId: kind === 'o' ? id : undefined
    })
    linkMsg[m.id] = 'Vinculado ✓'
  } catch (e) {
    linkMsg[m.id] = e.response?.data?.error || 'Error'
  }
}

onMounted(async () => {
  try { msStatus.value = (await axios.get('/api/microsoft/status')).data } catch { msStatus.value = { connected: false } }
  try { gStatus.value = (await axios.get('/api/google/status')).data } catch { gStatus.value = { connected: false } }
  try { contactos.value = (await axios.get('/api/contactos', { params: { limit: 100 } })).data.data || [] } catch { /* */ }
  try { oportunidades.value = (await axios.get('/api/oportunidades', { params: { limit: 100 } })).data.data || [] } catch { /* */ }
  if (msStatus.value?.connected) {
    await fetchEmails()
    connectStream()
  }
})

onBeforeUnmount(() => { try { es?.close() } catch { /* noop */ } })
</script>

<style scoped>
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
