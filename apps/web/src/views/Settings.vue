<template>
  <div class="p-6 max-w-4xl">
    <header class="mb-6">
      <p class="text-sm text-zinc-500">Conexiones e integraciones del CRM</p>
    </header>

    <div v-if="banner" :class="bannerOk ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'" class="mb-4 px-4 py-3 rounded-lg border text-sm">
      {{ banner }}
    </div>

    <div class="mb-6 flex flex-wrap gap-2">
      <button @click="tab = 'conexiones'" class="px-4 py-2 rounded-full text-sm border" :class="tab === 'conexiones' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 font-medium' : 'border-zinc-300 dark:border-zinc-600'">Conexiones</button>
      <button v-if="authStore.user?.role === 'admin'" @click="tab = 'credenciales'" class="px-4 py-2 rounded-full text-sm border" :class="tab === 'credenciales' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 font-medium' : 'border-zinc-300 dark:border-zinc-600'">Credenciales</button>
      <button v-if="authStore.user?.role === 'admin'" @click="tab = 'campos'" class="px-4 py-2 rounded-full text-sm border" :class="tab === 'campos' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 font-medium' : 'border-zinc-300 dark:border-zinc-600'">Campos</button>
      <button v-if="authStore.user?.role === 'admin'" @click="tab = 'equipos'" class="px-4 py-2 rounded-full text-sm border" :class="tab === 'equipos' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 font-medium' : 'border-zinc-300 dark:border-zinc-600'">Equipos</button>
      <button @click="tab = 'api'" class="px-4 py-2 rounded-full text-sm border" :class="tab === 'api' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 font-medium' : 'border-zinc-300 dark:border-zinc-600'">API</button>
    </div>

    <!-- Conexión Outlook -->
    <section v-if="tab === 'conexiones'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Outlook / Microsoft 365</h2>
      <p class="text-sm text-zinc-500 mb-4">Conecta tu buzón corporativo para leer y enviar correos desde el CRM.</p>

      <div v-if="status?.connected" class="space-y-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span class="font-medium">Conectado{{ profile ? ` como ${profile.displayName || profile.mail || profile.userPrincipalName}` : '' }}</span>
        </div>
        <p v-if="status.expiresAt" class="text-xs text-zinc-500">Token válido hasta {{ new Date(status.expiresAt).toLocaleString() }}</p>
        <button @click="desconectar" :disabled="working" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50">Desconectar</button>
      </div>
      <div v-else class="space-y-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
          <span>No conectado</span>
        </div>
        <button @click="conectar" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Conectar Outlook</button>
      </div>
      <p v-if="statusError" class="text-xs text-red-600 mt-2">{{ statusError }}</p>
    </section>

    <!-- Conexión Gmail -->
    <section v-if="tab === 'conexiones'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Gmail / Google Workspace</h2>
      <p class="text-sm text-zinc-500 mb-4">Conecta tu cuenta de Google para correo y calendario.</p>

      <div v-if="gStatus?.connected" class="space-y-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span class="font-medium">Conectado{{ gProfile ? ` como ${gProfile.name || gProfile.email}` : '' }}</span>
        </div>
        <button @click="desconectarGoogle" :disabled="working" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50">Desconectar</button>
      </div>
      <div v-else class="space-y-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
          <span>No conectado</span>
        </div>
        <button @click="conectarGoogle" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Conectar Gmail</button>
      </div>
      <p v-if="gError" class="text-xs text-red-600 mt-2">{{ gError }}</p>
    </section>

    <!-- Config Google global (admin) -->
    <section v-if="authStore.user?.role === 'admin' && tab === 'credenciales'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Credencial Google global</h2>
      <p class="text-sm text-zinc-500 mb-4">Un proyecto OAuth por despliegue (console.cloud.google.com → Credenciales → ID de cliente OAuth, tipo Web).</p>

      <form @submit.prevent="guardarGoogleConfig" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">Client ID *</label>
          <input v-model="gConfig.clientId" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Client Secret {{ gConfig.clientSecretConfigured ? '(configurado — vacío = mantener)' : '*' }}</label>
          <input v-model="gConfig.clientSecret" type="password" autocomplete="new-password" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Redirect URI *</label>
          <input v-model="gConfig.redirectUri" type="text" required placeholder="http://localhost:3001/api/auth/google/callback" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div class="flex items-center gap-2">
          <button type="submit" :disabled="saving" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
          <span v-if="gSaveMsg" class="text-sm text-zinc-500">{{ gSaveMsg }}</span>
        </div>
      </form>
    </section>

    <!-- Config global (admin) -->
    <section v-if="authStore.user?.role === 'admin' && tab === 'credenciales'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
      <h2 class="text-lg font-semibold mb-1">Credencial Microsoft global</h2>
      <p class="text-sm text-zinc-500 mb-4">Un App Registration por despliegue. Los empleados solo usan "Conectar Outlook".</p>

      <form @submit.prevent="guardarConfig" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">Client ID *</label>
          <input v-model="config.clientId" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Client Secret {{ config.clientSecretConfigured ? '(configurado — vacío = mantener)' : '*' }}</label>
          <input v-model="config.clientSecret" type="password" autocomplete="new-password" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Tenant ID</label>
          <input v-model="config.tenantId" type="text" placeholder="common" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Redirect URI *</label>
          <input v-model="config.redirectUri" type="text" required class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700" />
        </div>
        <div>
          <label class="block text-sm mb-1">Scopes (uno por línea)</label>
          <textarea v-model="scopesText" rows="4" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 font-mono text-sm"></textarea>
        </div>
        <div class="flex items-center gap-2">
          <button type="submit" :disabled="saving" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
          <span v-if="saveMsg" class="text-sm text-zinc-500">{{ saveMsg }}</span>
        </div>
      </form>
    </section>

    <!-- Campos personalizados (admin) -->
    <section v-if="authStore.user?.role === 'admin' && tab === 'campos'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Campos personalizados</h2>
      <p class="text-sm text-zinc-500 mb-4">Añade campos propios a contactos, empresas y oportunidades.</p>
      <div class="flex gap-2 mb-4">
        <button v-for="ent in ['contacto', 'empresa', 'oportunidad']" :key="ent" @click="cfEntidad = ent; fetchCustomFields()" class="px-3 py-1.5 rounded-full text-xs border" :class="cfEntidad === ent ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900' : 'border-zinc-300 dark:border-zinc-600'">{{ ent }}</button>
      </div>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700 mb-4">
        <li v-for="f in customFields" :key="f.id" class="py-2 flex items-center justify-between text-sm">
          <span>{{ f.etiqueta }} <span class="text-zinc-500 font-mono text-xs">{{ f.clave }} · {{ f.tipo }}{{ f.requerido ? ' · requerido' : '' }}</span></span>
          <button @click="borrarCustomField(f)" class="text-red-600 hover:underline text-xs">Eliminar</button>
        </li>
        <li v-if="!customFields.length" class="py-2 text-sm text-zinc-500">Sin campos en {{ cfEntidad }}.</li>
      </ul>
      <form @submit.prevent="crearCustomField" class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input v-model="cfForm.clave" type="text" required pattern="[a-z][a-z0-9_]{1,49}" placeholder="clave (ej. rfc)" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono" />
        <input v-model="cfForm.etiqueta" type="text" required placeholder="Etiqueta (ej. RFC)" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <select v-model="cfForm.tipo" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
          <option value="texto">Texto</option>
          <option value="numero">Número</option>
          <option value="fecha">Fecha</option>
          <option value="booleano">Sí/No</option>
          <option value="seleccion">Selección</option>
        </select>
        <input v-model="cfForm.opciones" type="text" placeholder="Opciones separadas por coma (solo selección)" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <label class="flex items-center gap-2 text-sm px-1"><input type="checkbox" v-model="cfForm.requerido" class="w-4 h-4" /> Requerido</label>
        <button type="submit" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Añadir campo</button>
      </form>
      <p v-if="cfMsg" class="text-sm text-zinc-500 mt-2">{{ cfMsg }}</p>
    </section>

    <!-- Equipos (admin) -->
    <section v-if="authStore.user?.role === 'admin' && tab === 'equipos'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Equipos</h2>
      <p class="text-sm text-zinc-500 mb-4">Agrupa usuarios para filtrar Pipeline y Tareas por alcance (mío / equipo / todos).</p>
      <form @submit.prevent="crearEquipo" class="flex gap-2 mb-4">
        <input v-model="eqNombre" type="text" required placeholder="Nombre del equipo" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <button type="submit" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Crear</button>
      </form>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="eq in equipos" :key="eq.id" class="py-3">
          <div class="flex items-center justify-between">
            <span class="font-medium text-sm">{{ eq.nombre }} <span class="text-zinc-500">({{ (eq.miembros || []).length }})</span></span>
            <button @click="borrarEquipo(eq)" class="text-red-600 hover:underline text-xs">Eliminar</button>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <span v-for="m in (eq.miembros || [])" :key="m.userId" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700">
              {{ m.name }} <button @click="quitarMiembro(eq, m)" class="text-red-500 hover:text-red-700">×</button>
            </span>
          </div>
          <div class="flex gap-2 mt-2">
            <select v-model="eqAdd[eq.id]" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs">
              <option value="">Añadir miembro...</option>
              <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
            </select>
            <button @click="agregarMiembro(eq)" :disabled="!eqAdd[eq.id]" class="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 text-xs disabled:opacity-50">Añadir</button>
          </div>
        </li>
        <li v-if="!equipos.length" class="py-2 text-sm text-zinc-500">Sin equipos.</li>
      </ul>
    </section>

    <!-- API pública -->
    <section v-if="tab === 'api'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">API pública</h2>
      <p class="text-sm text-zinc-500 mb-4">Tokens Bearer para integraciones. Usa <code class="font-mono text-xs">Authorization: Bearer crm_...</code> El token se muestra una sola vez. Documentación interactiva: <a href="/api/docs" target="_blank" class="text-blue-600 hover:underline font-mono text-xs">/api/docs</a></p>
      <div v-if="newToken" class="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm break-all">
        <span class="font-medium">Guárdalo ahora: </span><code class="font-mono">{{ newToken }}</code>
      </div>
      <form @submit.prevent="crearToken" class="flex gap-2 mb-4">
        <input v-model="tokenName" type="text" required placeholder="Nombre del token" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <button type="submit" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Crear</button>
      </form>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="t in tokens" :key="t.id" class="py-2 flex items-center justify-between text-sm">
          <span>{{ t.nombre }} <span class="text-zinc-500 font-mono text-xs">{{ t.prefijo }}…</span></span>
          <button @click="borrarToken(t)" class="text-red-600 hover:underline text-xs">Revocar</button>
        </li>
        <li v-if="!tokens.length" class="py-2 text-sm text-zinc-500">Sin tokens.</li>
      </ul>
    </section>

    <!-- Webhooks salientes (admin) -->
    <section v-if="authStore.user?.role === 'admin' && tab === 'api'" class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
      <h2 class="text-lg font-semibold mb-1">Webhooks salientes</h2>
      <p class="text-sm text-zinc-500 mb-4">Avisan a tus sistemas con firma HMAC (<code class="font-mono text-xs">X-CRM-Signature: sha256=...</code>).</p>
      <form @submit.prevent="crearWebhook" class="space-y-3 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input v-model="whForm.nombre" type="text" required placeholder="Nombre" class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
          <input v-model="whForm.url" type="url" required placeholder="https://..." class="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        </div>
        <input v-model="whForm.secret" type="text" required placeholder="Secreto para firmar (HMAC)" class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
        <div class="flex flex-wrap gap-2">
          <label v-for="ev in whEventos" :key="ev" class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-600 cursor-pointer">
            <input type="checkbox" :value="ev" v-model="whForm.eventos" /> {{ ev }}
          </label>
        </div>
        <button type="submit" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">Añadir webhook</button>
      </form>
      <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <li v-for="w in webhooks" :key="w.id" class="py-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ w.nombre }}</span>
            <button @click="borrarWebhook(w)" class="text-red-600 hover:underline text-xs">Eliminar</button>
          </div>
          <div class="text-zinc-500 text-xs break-all">{{ w.url }}</div>
          <div class="text-zinc-500 text-xs">{{ (w.eventos || []).join(', ') }}</div>
          <button @click="verDeliveries(w)" class="text-blue-600 hover:underline text-xs mt-1">Ver últimos envíos</button>
          <ul v-if="deliveries[w.id]" class="mt-1 space-y-1">
            <li v-for="d in deliveries[w.id]" :key="d.id" class="text-xs font-mono" :class="d.ok ? 'text-green-600' : 'text-red-600'">
              {{ new Date(d.created_at).toLocaleString() }} · {{ d.evento }} · {{ d.status_code ?? '—' }} {{ d.error ? `· ${d.error}` : '' }}
            </li>
          </ul>
        </li>
        <li v-if="!webhooks.length" class="py-2 text-sm text-zinc-500">Sin webhooks.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()

const tab = ref('conexiones')
const status = ref(null)
const profile = ref(null)
const statusError = ref('')
const working = ref(false)
const banner = ref('')
const bannerOk = ref(false)

const config = ref({ clientId: '', clientSecret: '', tenantId: 'common', redirectUri: '', activo: true })
const scopesText = ref('')
const saving = ref(false)
const saveMsg = ref('')

const tokens = ref([])
const tokenName = ref('')
const newToken = ref('')
const webhooks = ref([])
const whEventos = ref([])
const whForm = ref({ nombre: '', url: '', secret: '', eventos: [] })
const deliveries = ref({})

const customFields = ref([])
const cfEntidad = ref('contacto')
const cfForm = ref({ clave: '', etiqueta: '', tipo: 'texto', opciones: '', requerido: false })
const cfMsg = ref('')

const fetchCustomFields = async () => {
  try {
    const { data } = await axios.get('/api/custom-fields', { params: { entidad: cfEntidad.value } })
    customFields.value = data || []
  } catch { customFields.value = [] }
}
const crearCustomField = async () => {
  cfMsg.value = ''
  try {
    await axios.post('/api/custom-fields', {
      entidad: cfEntidad.value, clave: cfForm.value.clave, etiqueta: cfForm.value.etiqueta,
      tipo: cfForm.value.tipo,
      opciones: cfForm.value.opciones.split(',').map(s => s.trim()).filter(Boolean),
      requerido: cfForm.value.requerido,
    })
    cfForm.value = { clave: '', etiqueta: '', tipo: 'texto', opciones: '', requerido: false }
    await fetchCustomFields()
  } catch (e) { cfMsg.value = e.response?.data?.error || 'Error creando campo' }
}
const borrarCustomField = async (f) => {
  if (!confirm(`¿Eliminar campo ${f.etiqueta}? Los valores guardados se conservan.`)) return
  await axios.delete(`/api/custom-fields/${f.id}`)
  await fetchCustomFields()
}

const equipos = ref([])
const usuarios = ref([])
const eqNombre = ref('')
const eqAdd = ref({})

const fetchEquipos = async () => {
  try {
    const { data } = await axios.get('/api/equipos')
    equipos.value = data || []
  } catch { equipos.value = [] }
}
const crearEquipo = async () => {
  await axios.post('/api/equipos', { nombre: eqNombre.value })
  eqNombre.value = ''
  await fetchEquipos()
}
const borrarEquipo = async (eq) => {
  if (!confirm(`¿Eliminar equipo ${eq.nombre}?`)) return
  await axios.delete(`/api/equipos/${eq.id}`)
  await fetchEquipos()
}
const agregarMiembro = async (eq) => {
  if (!eqAdd.value[eq.id]) return
  await axios.post(`/api/equipos/${eq.id}/miembros`, { userId: eqAdd.value[eq.id] })
  eqAdd.value[eq.id] = ''
  await fetchEquipos()
}
const quitarMiembro = async (eq, m) => {
  await axios.delete(`/api/equipos/${eq.id}/miembros/${m.userId}`)
  await fetchEquipos()
}

const fetchTokens = async () => {
  try { tokens.value = (await axios.get('/api/api-tokens')).data } catch { /* */ }
}
const crearToken = async () => {
  try {
    const { data } = await axios.post('/api/api-tokens', { nombre: tokenName.value })
    newToken.value = data.token
    tokenName.value = ''
    await fetchTokens()
  } catch { /* */ }
}
const borrarToken = async (t) => {
  if (!confirm(`¿Revocar ${t.nombre}?`)) return
  await axios.delete(`/api/api-tokens/${t.id}`)
  await fetchTokens()
}
const fetchWebhooks = async () => {
  try {
    const { data } = await axios.get('/api/webhooks')
    webhooks.value = data.endpoints || []
    whEventos.value = data.eventos || []
  } catch { /* sin permiso */ }
}
const crearWebhook = async () => {
  try {
    await axios.post('/api/webhooks', whForm.value)
    whForm.value = { nombre: '', url: '', secret: '', eventos: [] }
    await fetchWebhooks()
  } catch (e) { alert(e.response?.data?.error || 'Error creando webhook') }
}
const borrarWebhook = async (w) => {
  if (!confirm(`¿Eliminar ${w.nombre}?`)) return
  await axios.delete(`/api/webhooks/${w.id}`)
  await fetchWebhooks()
}
const verDeliveries = async (w) => {
  try {
    const { data } = await axios.get(`/api/webhooks/${w.id}/deliveries`)
    deliveries.value = { ...deliveries.value, [w.id]: data }
  } catch { /* */ }
}

const conectar = () => {
  window.location.href = '/api/auth/microsoft/connect'
}

const gStatus = ref(null)
const gProfile = ref(null)
const gError = ref('')
const gConfig = ref({ clientId: '', clientSecret: '', redirectUri: '' })
const gSaveMsg = ref('')

const conectarGoogle = () => {
  window.location.href = '/api/auth/google/connect'
}

const desconectarGoogle = async () => {
  working.value = true
  try {
    await axios.delete('/api/google/disconnect')
    gStatus.value = { connected: false }
    gProfile.value = null
  } catch { gError.value = 'No se pudo desconectar' } finally { working.value = false }
}

const guardarGoogleConfig = async () => {
  saving.value = true
  gSaveMsg.value = ''
  try {
    const payload = { clientId: gConfig.value.clientId, redirectUri: gConfig.value.redirectUri }
    if (gConfig.value.clientSecret) payload.clientSecret = gConfig.value.clientSecret
    await axios.put('/api/google/config', payload)
    gConfig.value.clientSecret = ''
    gSaveMsg.value = 'Configuración guardada'
  } catch (e) {
    gSaveMsg.value = e.response?.data?.error || 'Error guardando configuración'
  } finally { saving.value = false }
}

const desconectar = async () => {
  working.value = true
  try {
    await axios.delete('/api/microsoft/disconnect')
    status.value = { connected: false }
    profile.value = null
  } catch (e) {
    statusError.value = 'No se pudo desconectar'
  } finally {
    working.value = false
  }
}

const guardarConfig = async () => {
  saving.value = true
  saveMsg.value = ''
  try {
    const payload = {
      clientId: config.value.clientId,
      tenantId: config.value.tenantId || 'common',
      redirectUri: config.value.redirectUri,
      scopes: scopesText.value.split('\n').map(s => s.trim()).filter(Boolean),
      activo: true
    }
    if (config.value.clientSecret) payload.clientSecret = config.value.clientSecret
    await axios.put('/api/microsoft/config', payload)
    config.value.clientSecret = ''
    saveMsg.value = 'Configuración guardada'
  } catch (e) {
    saveMsg.value = e.response?.data?.error || 'Error guardando configuración'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (route.query.microsoft_connected) {
    banner.value = 'Outlook conectado correctamente'
    bannerOk.value = true
  } else if (route.query.microsoft_error) {
    banner.value = `Error conectando Outlook: ${route.query.microsoft_error}`
    bannerOk.value = false
  } else if (route.query.google_connected) {
    banner.value = 'Gmail conectado correctamente'
    bannerOk.value = true
  } else if (route.query.google_error) {
    banner.value = `Error conectando Gmail: ${route.query.google_error}`
    bannerOk.value = false
  }
  try {
    const { data } = await axios.get('/api/google/status')
    gStatus.value = data
    if (data.connected) {
      try {
        const p = await axios.get('/api/google/profile')
        if (!p.data?.error) gProfile.value = p.data
      } catch { /* sin perfil */ }
    }
  } catch { gError.value = 'No se pudo consultar el estado de Google' }
  try {
    const { data } = await axios.get('/api/microsoft/status')
    status.value = data
    if (data.connected) {
      try {
        const p = await axios.get('/api/microsoft/profile')
        if (!p.data?.error) profile.value = p.data
      } catch { /* sin perfil */ }
    }
  } catch (e) {
    statusError.value = 'No se pudo consultar el estado'
  }
  await fetchTokens()
  if (authStore.user?.role === 'admin') {
    try {
      const { data } = await axios.get('/api/users')
      usuarios.value = data || []
    } catch { /* */ }
    await fetchEquipos()
    try {
      const { data } = await axios.get('/api/google/config')
      if (data.configured) {
        gConfig.value.clientId = data.config.clientId || ''
        gConfig.value.redirectUri = data.config.redirectUri || ''
        gConfig.value.clientSecretConfigured = data.config.clientSecretConfigured
      }
    } catch { /* sin config */ }
    await fetchCustomFields()
    await fetchWebhooks()
    try {
      const { data } = await axios.get('/api/microsoft/config')
      if (data.configured) {
        config.value.clientId = data.config.clientId || ''
        config.value.tenantId = data.config.tenantId || 'common'
        config.value.redirectUri = data.config.redirectUri || ''
        config.value.clientSecretConfigured = data.config.clientSecretConfigured
        scopesText.value = (data.config.scopes || []).join('\n')
      }
    } catch { /* sin config */ }
  }
})
</script>
