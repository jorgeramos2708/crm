<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Select v-model="fEstado" @change="fetchPresupuestos">
        <option value="">Todos los estados</option>
        <option value="borrador">Borrador</option>
        <option value="enviado">Enviado</option>
        <option value="aceptado">Aceptado</option>
        <option value="rechazado">Rechazado</option>
        <option value="vencido">Vencido</option>
      </Select>
      <div class="ml-auto">
        <Btn @click="openModal(null)">+ Nuevo Presupuesto</Btn>
      </div>
    </div>

    <Card class="overflow-hidden">
      <Table>
        <template #head>
          <tr>
            <Th>Folio</Th>
            <Th>Estado</Th>
            <Th align="right">Total</Th>
            <Th align="right">Acciones</Th>
          </tr>
        </template>
        <tr
          v-for="p in presupuestos"
          :key="p.id"
          class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
        >
          <Td tone="strong" class="font-mono">{{ p.folio }}</Td>
          <td class="px-6 py-4 text-sm">
            <span
              class="px-2 py-1 rounded-full text-xs"
              :class="estadoClass(p.estado)"
              >{{ p.estado }}</span
            >
          </td>
          <Td align="right" class="font-medium tabular-nums">{{
            formatCurrency(p.total)
          }}</Td>
          <td class="px-6 py-4 text-right text-sm">
            <Btn variant="link" class="mr-3" @click="verDetalle(p)">Ver</Btn>
            <Btn variant="link-danger" @click="eliminar(p)">Eliminar</Btn>
          </td>
        </tr>
        <TableState
          v-if="cargando && !presupuestos.length"
          :colspan="4"
          loading
        />
        <TableState
          v-if="!cargando && !presupuestos.length"
          :colspan="4"
        >
          Sin presupuestos.
        </TableState>
      </Table>
    </Card>

    <!-- Modal crear/editar -->
    <Modal
      :open="showModal"
      max-width="max-w-2xl"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="showModal = false"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editing ? `Editar ${editing.folio}` : "Nuevo Presupuesto" }}
        </h2>
      </template>
      <form @submit.prevent="guardar" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Oportunidad">
            <Select v-model="form.oportunidadId" class="w-full">
              <option value="">—</option>
              <option v-for="o in oportunidades" :key="o.id" :value="o.id">
                {{ o.nombre }}
              </option>
            </Select>
          </Field>
          <Field label="Contacto">
            <Select v-model="form.contactoId" class="w-full">
              <option value="">—</option>
              <option v-for="c in contactos" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </Select>
          </Field>
          <Field label="Empresa">
            <Select v-model="form.empresaId" class="w-full">
              <option value="">—</option>
              <option v-for="e in empresas" :key="e.id" :value="e.id">
                {{ e.nombre }}
              </option>
            </Select>
          </Field>
        </div>

        <div>
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <label class="block text-sm font-medium">Conceptos</label>
            <div class="flex flex-wrap gap-2">
              <Select v-model="prodSel" size="sm">
                <option value="">Del catálogo...</option>
                <option v-for="p in productos" :key="p.id" :value="p.id">
                  {{ p.nombre }} — {{ formatCurrency(p.precio) }}
                </option>
              </Select>
              <Btn
                type="button"
                variant="outline"
                size="sm"
                @click="agregarProducto"
                :disabled="!prodSel"
                >Añadir</Btn
              >
              <Btn
                type="button"
                variant="outline"
                size="sm"
                @click="
                  form.items.push({
                    descripcion: '',
                    cantidad: 1,
                    precio: 0,
                    productoId: null,
                  })
                "
                >+ Línea</Btn
              >
            </div>
          </div>
          <div
            v-for="(it, i) in form.items"
            :key="i"
            class="grid grid-cols-12 gap-2 mb-2"
          >
            <Input
              v-model="it.descripcion"
              type="text"
              placeholder="Concepto"
              class="col-span-6"
            />
            <input
              v-model.number="it.cantidad"
              type="number"
              min="0"
              placeholder="Cant."
              class="col-span-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
            />
            <input
              v-model.number="it.precio"
              type="number"
              min="0"
              placeholder="Precio"
              class="col-span-3 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
            />
            <button
              type="button"
              @click="form.items.splice(i, 1)"
              class="col-span-1 text-red-600 text-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="max-w-[6.5rem]">
            <Field label="Descuento">
              <div class="relative">
                <input
                  v-model.number="form.descuento"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full pl-3 pr-8 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500"
                  >%</span
                >
              </div>
            </Field>
          </div>
          <div class="max-w-[6.5rem]">
            <span class="block text-sm mb-1">Impuesto</span>
            <label
              class="flex items-center gap-2 h-[38px] text-sm cursor-pointer select-none"
              ><input
                type="checkbox"
                v-model="form.aplicaIva"
                class="w-4 h-4"
              />
              IVA</label
            >
          </div>
          <Field label="Estado">
            <Select v-model="form.estado" class="w-full">
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="aceptado">Aceptado</option>
              <option value="rechazado">Rechazado</option>
              <option value="vencido">Vencido</option>
            </Select>
          </Field>
          <div>
            <label class="block text-sm mb-1">Válido hasta</label>
            <FechaInput
              v-model="form.validez"
              class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm"
            />
          </div>
        </div>

        <Field label="Notas">
          <Input v-model="form.notas" multiline :rows="2" class="w-full" />
        </Field>

        <div class="text-right text-sm space-y-1">
          <div class="text-zinc-500">
            Subtotal: {{ formatCurrency(subtotalCalc) }}
          </div>
          <div v-if="descPct" class="text-zinc-500">
            Descuento ({{ descPct }}%): −{{ formatCurrency(descMonto) }}
          </div>
          <div v-if="form.aplicaIva" class="text-zinc-500">
            IVA (16%): {{ formatCurrency(ivaMonto) }}
          </div>
          <div class="text-lg font-bold">
            Total: {{ formatCurrency(totalCalc) }}
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="showModal = false"
            >Cancelar</Btn
          >
          <Btn type="submit" variant="primary" class="flex-1">Guardar</Btn>
        </div>
      </form>
    </Modal>

    <!-- Detalle -->
    <Modal
      :open="!!detalle"
      max-width="max-w-2xl"
      content-class="max-h-[90vh] overflow-y-auto print:shadow-none"
      @close="detalle = null"
    >
      <template #title>
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold font-mono">{{ detalle.folio }}</h2>
            <p class="text-sm text-zinc-500">
              {{ detalle.estado }} ·
              {{
                detalle.oportunidad?.nombre ||
                detalle.contacto?.nombre ||
                detalle.empresa?.nombre ||
                "Sin vínculo"
              }}
            </p>
          </div>
          <Btn
            variant="outline"
            size="sm"
            class="print:hidden"
            @click="detalle = null"
            >Cerrar</Btn
          >
        </div>
      </template>
      <table class="w-full text-sm mb-4">
        <thead>
          <tr class="text-left text-zinc-500 text-xs uppercase">
            <Th compact>Concepto</Th>
            <Th compact align="right">Cant.</Th>
            <Th compact align="right">Precio</Th>
            <Th compact align="right">Importe</Th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(it, i) in detalle.items || []"
            :key="i"
            class="border-t border-zinc-200 dark:border-zinc-700"
          >
            <Td compact tone="strong">{{ it.descripcion }}</Td>
            <Td compact align="right" tone="strong" class="tabular-nums">{{
              it.cantidad
            }}</Td>
            <Td compact align="right" tone="strong" class="tabular-nums">
              {{ formatCurrency(it.precio) }}
            </Td>
            <Td compact align="right" tone="strong" class="tabular-nums">
              {{ formatCurrency(it.cantidad * it.precio) }}
            </Td>
          </tr>
        </tbody>
      </table>
      <div class="text-right text-sm space-y-1">
        <div class="text-zinc-500">
          Subtotal: {{ formatCurrency(detalle.subtotal) }}
        </div>
        <div v-if="detalle.descuento" class="text-zinc-500">
          Descuento: −{{ formatCurrency(detalle.descuento) }}
        </div>
        <div v-if="detalle.impuestos" class="text-zinc-500">
          IVA (16%): {{ formatCurrency(detalle.impuestos) }}
        </div>
        <div class="text-lg font-bold">
          Total: {{ formatCurrency(detalle.total) }}
        </div>
      </div>
      <p v-if="detalle.notas" class="text-sm text-zinc-500 mt-4">
        {{ detalle.notas }}
      </p>
      <div class="flex gap-2 mt-4 print:hidden">
        <Btn variant="outline" class="flex-1" @click="window.print()"
          >Imprimir</Btn
        >
        <Btn
          variant="outline"
          class="flex-1"
          @click="
            openModal(detalle);
            detalle = null;
          "
          >Editar</Btn
        >
        <Select
          :modelValue="detalle.estado"
          @change="cambiarEstado(detalle, $event.target.value)"
          class="flex-1"
        >
          <option value="borrador">Borrador</option>
          <option value="enviado">Enviado</option>
          <option value="aceptado">Aceptado</option>
          <option value="rechazado">Rechazado</option>
          <option value="vencido">Vencido</option>
        </Select>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import FechaInput from "../components/FechaInput.vue";
import Btn from "../components/Btn.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import TableState from "../components/TableState.vue";

const presupuestos = ref([]);
const oportunidades = ref([]);
const contactos = ref([]);
const empresas = ref([]);
const productos = ref([]);
const fEstado = ref("");
const showModal = ref(false);
const editing = ref(null);
const detalle = ref(null);
const prodSel = ref("");
const form = ref({
  oportunidadId: "",
  contactoId: "",
  empresaId: "",
  items: [],
  descuento: 0,
  aplicaIva: false,
  estado: "borrador",
  validez: "",
  notas: "",
});

const subtotalCalc = computed(() =>
  form.value.items.reduce(
    (a, it) => a + (Number(it.cantidad) || 0) * (Number(it.precio) || 0),
    0,
  ),
);
const descPct = computed(() =>
  Math.min(100, Math.max(0, Number(form.value.descuento) || 0)),
);
const descMonto = computed(() => (subtotalCalc.value * descPct.value) / 100);
const ivaMonto = computed(() =>
  form.value.aplicaIva
    ? Math.round((subtotalCalc.value - descMonto.value) * 0.16)
    : 0,
);
const totalCalc = computed(() =>
  Math.max(
    0,
    Math.round(subtotalCalc.value - descMonto.value + ivaMonto.value),
  ),
);

const estadoClass = (e) =>
  ({
    borrador: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300",
    enviado: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    aceptado:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    rechazado: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    vencido:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  })[e] || "";

const cargando = ref(true);
const fetchPresupuestos = async () => {
  cargando.value = true;
  try {
    const { data } = await axios.get("/api/presupuestos", {
      params: { estado: fEstado.value || undefined },
    });
    presupuestos.value = data || [];
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar presupuestos");
  } finally {
    cargando.value = false;
  }
};

const agregarProducto = () => {
  const p = productos.value.find((x) => x.id === prodSel.value);
  if (!p) return;
  form.value.items.push({
    descripcion: p.nombre,
    cantidad: 1,
    precio: p.precio,
    productoId: p.id,
  });
  prodSel.value = "";
};

const openModal = (p) => {
  editing.value = p;
  form.value = p
    ? {
        oportunidadId: p.oportunidadId || "",
        contactoId: p.contactoId || "",
        empresaId: p.empresaId || "",
        items: JSON.parse(JSON.stringify(p.items || [])),
        descuento: p.descuento,
        aplicaIva: p.aplicaIva ?? (p.impuestos > 0),
        estado: p.estado,
        validez: p.validez ? p.validez.slice(0, 10) : "",
        notas: p.notas || "",
      }
    : {
        oportunidadId: "",
        contactoId: "",
        empresaId: "",
        items: [],
        descuento: 0,
        aplicaIva: false,
        estado: "borrador",
        validez: "",
        notas: "",
      };
  showModal.value = true;
};

const guardar = async () => {
  try {
    const payload = { ...form.value, validez: form.value.validez || undefined };
    if (editing.value)
      await axios.put(`/api/presupuestos/${editing.value.id}`, payload);
    else await axios.post("/api/presupuestos", payload);
    showModal.value = false;
    await fetchPresupuestos();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error guardando");
  }
};

const verDetalle = async (p) => {
  try {
    const { data } = await axios.get(`/api/presupuestos/${p.id}`);
    detalle.value = data;
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar el detalle");
  }
};

const cambiarEstado = async (p, estado) => {
  try {
    await axios.put(`/api/presupuestos/${p.id}`, { estado });
    await verDetalle({ ...p });
    await fetchPresupuestos();
  } catch (e) {
    console.error(e);
    toast.error("Error al cambiar el estado");
  }
};

const eliminar = async (p) => {
  if (!(await confirmar(`¿Eliminar ${p.folio}?`))) return;
  try {
    await axios.delete(`/api/presupuestos/${p.id}`);
    await fetchPresupuestos();
  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || "Error al eliminar");
  }
};

onMounted(async () => {
  await loadCurrency();
  try {
    const [o, c, e, pr] = await Promise.all([
      axios.get("/api/oportunidades", { params: { limit: 200 } }),
      axios.get("/api/contactos", { params: { limit: 200 } }),
      axios.get("/api/companies", { params: { limit: 200 } }),
      axios.get("/api/productos", { params: { limit: 200 } }),
    ]);
    oportunidades.value = o.data.data || [];
    contactos.value = c.data.data || [];
    empresas.value = e.data.data || [];
    productos.value = pr.data || [];
  } catch {
    /* */
  }
  await fetchPresupuestos();
});
</script>
