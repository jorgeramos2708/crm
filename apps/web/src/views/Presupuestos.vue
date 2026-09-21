<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <select v-model="fEstado" @change="fetchPresupuestos" class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviado">Enviado</option>
        <option value="aceptado">Aceptado</option>
        <option value="rechazado">Rechazado</option>
        <option value="vencido">Vencido</option>
      </select>
      <div class="ml-auto">
        <button @click="openModal(null)" class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">+ Nuevo Presupuesto</button>
      </div>
    </div>

    <div class="panel-flat overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-700/50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Folio</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <tr v-for="p in presupuestos" :key="p.id" class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
              <td class="px-6 py-4 text-sm font-mono">{{ p.folio }}</td>
              <td class="px-6 py-4 text-sm"><span class="px-2 py-1 rounded-full text-xs" :class="estadoClass(p.estado)">{{ p.estado }}</span></td>
              <td class="px-6 py-4 text-sm text-right tabular-nums font-medium">{{ formatCurrency(p.total) }}</td>
              <td class="px-6 py-4 text-right text-sm">
                <button @click="verDetalle(p)" class="text-blue-600 hover:underline mr-3">Ver</button>
                <button @click="eliminar(p)" class="text-red-600 hover:underline">Eliminar</button>
              </td>
            </tr>
            <tr v-if="cargando && !presupuestos.length">
              <td colspan="4"><div class="p-4"><Skeleton :filas="5" /></div></td>
            </tr>
            <tr v-if="!cargando && !presupuestos.length">
              <td colspan="4" class="px-6 py-12 text-center text-sm text-zinc-500">Sin presupuestos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">{{ editing ? `Editar ${editing.folio}` : 'Nuevo Presupuesto' }}</h2>
        <form @submit.prevent="guardar" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-sm mb-1">Oportunidad</label>
              <select v-model="form.oportunidadId" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
                <option value="">—</option>
                <option v-for="o in oportunidades" :key="o.id" :value="o.id">{{ o.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Contacto</label>
              <select v-model="form.contactoId" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
                <option value="">—</option>
                <option v-for="c in contactos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Empresa</label>
              <select v-model="form.empresaId" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
                <option value="">—</option>
                <option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium">Conceptos</label>
              <div class="flex gap-2">
                <select v-model="prodSel" class="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-xs">
                  <option value="">Del catálogo...</option>
                  <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }} — {{ formatCurrency(p.precio) }}</option>
                </select>
                <button type="button" @click="agregarProducto" :disabled="!prodSel" class="px-3 py-1 rounded-lg border text-xs disabled:opacity-50">Añadir</button>
                <button type="button" @click="form.items.push({ descripcion: '', cantidad: 1, precio: 0, productoId: null })" class="px-3 py-1 rounded-lg border text-xs">+ Línea</button>
              </div>
            </div>
            <div v-for="(it, i) in form.items" :key="i" class="grid grid-cols-12 gap-2 mb-2">
              <input v-model="it.descripcion" type="text" placeholder="Concepto" class="col-span-6 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
              <input v-model.number="it.cantidad" type="number" min="0" placeholder="Cant." class="col-span-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
              <input v-model.number="it.precio" type="number" min="0" placeholder="Precio" class="col-span-3 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
              <button type="button" @click="form.items.splice(i, 1)" class="col-span-1 text-red-600 text-lg">×</button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-sm mb-1">Descuento</label>
              <div class="relative">
                <input v-model.number="form.descuento" type="number" min="0" max="100" class="w-full pl-3 pr-8 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">%</span>
              </div>
            </div>
            <div>
              <label class="block text-sm mb-1">Impuestos (16% fijo)</label>
              <input :value="16" type="number" disabled class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50 text-sm text-zinc-500" />
            </div>
            <div>
              <label class="block text-sm mb-1">Estado</label>
              <select v-model="form.estado" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm">
                <option value="borrador">Borrador</option>
                <option value="enviado">Enviado</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>
            <div>
              <label class="block text-sm mb-1">Válido hasta</label>
              <FechaInput v-model="form.validez" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1">Notas</label>
            <textarea v-model="form.notas" rows="2" class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"></textarea>
          </div>

          <div class="text-right text-sm space-y-1">
            <div class="text-zinc-500">Subtotal: {{ formatCurrency(subtotalCalc) }}</div>
            <div v-if="descPct" class="text-zinc-500">Descuento ({{ descPct }}%): −{{ formatCurrency(descMonto) }}</div>
            <div class="text-zinc-500">IVA (16%): {{ formatCurrency(ivaMonto) }}</div>
            <div class="text-lg font-bold">Total: {{ formatCurrency(totalCalc) }}</div>
          </div>

          <div class="flex gap-2 pt-2">
            <button type="button" @click="showModal = false" class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600">Cancelar</button>
            <button type="submit" class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detalle -->
    <div v-if="detalle" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold font-mono">{{ detalle.folio }}</h2>
            <p class="text-sm text-zinc-500">{{ detalle.estado }} · {{ detalle.oportunidad?.nombre || detalle.contacto?.nombre || detalle.empresa?.nombre || 'Sin vínculo' }}</p>
          </div>
          <button @click="detalle = null" class="px-3 py-1 rounded-lg border text-sm print:hidden">Cerrar</button>
        </div>
        <table class="w-full text-sm mb-4">
          <thead><tr class="text-left text-zinc-500 text-xs uppercase"><th class="py-2">Concepto</th><th class="text-right">Cant.</th><th class="text-right">Precio</th><th class="text-right">Importe</th></tr></thead>
          <tbody>
            <tr v-for="(it, i) in (detalle.items || [])" :key="i" class="border-t border-zinc-200 dark:border-zinc-700">
              <td class="py-2">{{ it.descripcion }}</td>
              <td class="text-right tabular-nums">{{ it.cantidad }}</td>
              <td class="text-right tabular-nums">{{ formatCurrency(it.precio) }}</td>
              <td class="text-right tabular-nums">{{ formatCurrency(it.cantidad * it.precio) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="text-right text-sm space-y-1">
          <div class="text-zinc-500">Subtotal: {{ formatCurrency(detalle.subtotal) }}</div>
          <div v-if="detalle.descuento" class="text-zinc-500">Descuento: −{{ formatCurrency(detalle.descuento) }}</div>
          <div v-if="detalle.impuestos" class="text-zinc-500">IVA (16%): {{ formatCurrency(detalle.impuestos) }}</div>
          <div class="text-lg font-bold">Total: {{ formatCurrency(detalle.total) }}</div>
        </div>
        <p v-if="detalle.notas" class="text-sm text-zinc-500 mt-4">{{ detalle.notas }}</p>
        <div class="flex gap-2 mt-4 print:hidden">
          <button @click="window.print()" class="flex-1 px-4 py-2 rounded-lg border text-sm">Imprimir</button>
          <button @click="openModal(detalle); detalle = null" class="flex-1 px-4 py-2 rounded-lg border text-sm">Editar</button>
          <select :value="detalle.estado" @change="cambiarEstado(detalle, $event.target.value)" class="flex-1 px-3 py-2 rounded-lg border text-sm">
            <option value="borrador">Borrador</option>
            <option value="enviado">Enviado</option>
            <option value="aceptado">Aceptado</option>
            <option value="rechazado">Rechazado</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Skeleton from '../components/Skeleton.vue'
import { toast } from '../utils/toast'
import { confirmar } from '../utils/confirm'
import { formatCurrency, loadCurrency } from '../utils/currency'
import FechaInput from '../components/FechaInput.vue'

const presupuestos = ref([])
const oportunidades = ref([])
const contactos = ref([])
const empresas = ref([])
const productos = ref([])
const fEstado = ref('')
const showModal = ref(false)
const editing = ref(null)
const detalle = ref(null)
const prodSel = ref('')
const form = ref({ oportunidadId: '', contactoId: '', empresaId: '', items: [], descuento: 0, impuestos: 0, estado: 'borrador', validez: '', notas: '' })

const subtotalCalc = computed(() => form.value.items.reduce((a, it) => a + (Number(it.cantidad) || 0) * (Number(it.precio) || 0), 0))
const descPct = computed(() => Math.min(100, Math.max(0, Number(form.value.descuento) || 0)))
const descMonto = computed(() => subtotalCalc.value * descPct.value / 100)
const ivaMonto = computed(() => Math.round((subtotalCalc.value - descMonto.value) * 0.16))
const totalCalc = computed(() => Math.max(0, Math.round(subtotalCalc.value - descMonto.value + ivaMonto.value)))

const estadoClass = (e) => ({
  borrador: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
  enviado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  aceptado: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  rechazado: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  vencido: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
}[e] || '')

const cargando = ref(true)
const fetchPresupuestos = async () => {
  cargando.value = true
  try {
    const { data } = await axios.get('/api/presupuestos', { params: { estado: fEstado.value || undefined } })
    presupuestos.value = data || []
  } catch (e) { console.error(e) } finally { cargando.value = false }
}

const agregarProducto = () => {
  const p = productos.value.find(x => x.id === prodSel.value)
  if (!p) return
  form.value.items.push({ descripcion: p.nombre, cantidad: 1, precio: p.precio, productoId: p.id })
  prodSel.value = ''
}

const openModal = (p) => {
  editing.value = p
  form.value = p
    ? { oportunidadId: p.oportunidadId || '', contactoId: p.contactoId || '', empresaId: p.empresaId || '', items: JSON.parse(JSON.stringify(p.items || [])), descuento: p.descuento, impuestos: p.impuestos, estado: p.estado, validez: p.validez ? p.validez.slice(0, 10) : '', notas: p.notas || '' }
    : { oportunidadId: '', contactoId: '', empresaId: '', items: [], descuento: 0, impuestos: 0, estado: 'borrador', validez: '', notas: '' }
  showModal.value = true
}

const guardar = async () => {
  try {
    const payload = { ...form.value, validez: form.value.validez || undefined }
    if (editing.value) await axios.put(`/api/presupuestos/${editing.value.id}`, payload)
    else await axios.post('/api/presupuestos', payload)
    showModal.value = false
    await fetchPresupuestos()
  } catch (e) { toast.error(e.response?.data?.error || 'Error guardando') }
}

const verDetalle = async (p) => {
  const { data } = await axios.get(`/api/presupuestos/${p.id}`)
  detalle.value = data
}

const cambiarEstado = async (p, estado) => {
  await axios.put(`/api/presupuestos/${p.id}`, { estado })
  await verDetalle({ ...p })
  await fetchPresupuestos()
}

const eliminar = async (p) => {
  if (!await confirmar(`¿Eliminar ${p.folio}?`)) return
  await axios.delete(`/api/presupuestos/${p.id}`)
  await fetchPresupuestos()
}

onMounted(async () => {
  await loadCurrency()
  try {
    const [o, c, e, pr] = await Promise.all([
      axios.get('/api/oportunidades', { params: { limit: 200 } }),
      axios.get('/api/contactos', { params: { limit: 200 } }),
      axios.get('/api/companies', { params: { limit: 200 } }),
      axios.get('/api/productos', { params: { limit: 200 } }),
    ])
    oportunidades.value = o.data.data || []
    contactos.value = c.data.data || []
    empresas.value = e.data.data || []
    productos.value = pr.data || []
  } catch { /* */ }
  await fetchPresupuestos()
})
</script>
