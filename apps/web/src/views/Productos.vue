<template>
  <div class="p-6">
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model="q"
        @input="fetchProductos"
        type="text"
        placeholder="Buscar por nombre o SKU..."
        class="flex-1 min-w-[200px]"
      />
      <div class="ml-auto">
        <Btn @click="openModal(null)">+ Nuevo Producto</Btn>
      </div>
    </div>

    <Card class="overflow-hidden">
      <Table>
        <template #head>
          <tr>
            <Th>Producto</Th>
            <Th>SKU</Th>
            <Th align="right">Precio</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </tr>
        </template>
        <tr
          v-for="p in productos"
          :key="p.id"
          class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
        >
          <Td primary>
            {{ p.nombre }}
            <div
              v-if="p.descripcion"
              class="font-normal text-xs text-zinc-500 truncate max-w-xs"
            >
              {{ p.descripcion }}
            </div>
          </Td>
          <Td class="font-mono">
            {{ p.sku || "—" }}
          </Td>
          <Td align="right" tone="strong" class="tabular-nums">
            {{ formatCurrency(p.precio) }}
          </Td>
          <Td>
            <Badge
              :color="p.activo ? 'green' : 'zinc'"
              variant="pill"
              :dot="false"
              >{{ p.activo ? "Activo" : "Inactivo" }}</Badge
            >
          </Td>
          <td class="px-6 py-4 text-right text-sm">
            <Btn variant="link" class="mr-3" @click="openModal(p)">Editar</Btn>
            <Btn variant="link-danger" @click="eliminar(p)">Eliminar</Btn>
          </td>
        </tr>
        <TableState
          v-if="cargando && !productos.length"
          :colspan="5"
          loading
        />
        <TableState
          v-if="!cargando && !productos.length"
          :colspan="5"
        >
          Sin productos en el catálogo.
        </TableState>
      </Table>
    </Card>

    <Modal :open="showModal" @close="showModal = false">
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editing ? "Editar Producto" : "Nuevo Producto" }}
        </h2>
      </template>
      <form @submit.prevent="guardar" class="space-y-4">
        <Field label="Nombre" required>
          <Input v-model="form.nombre" type="text" required class="w-full" />
        </Field>
        <div class="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <Input v-model="form.sku" type="text" class="w-full font-mono" />
          </Field>
          <Field label="Precio" required>
            <input
              v-model.number="form.precio"
              type="number"
              min="0"
              required
              class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
            />
          </Field>
        </div>
        <Field label="Descripción">
          <Input
            v-model="form.descripcion"
            multiline
            :rows="2"
            class="w-full"
          />
        </Field>
        <label class="flex items-center gap-2 text-sm cursor-pointer"
          ><input type="checkbox" v-model="form.activo" class="w-4 h-4" />
          Activo</label
        >
        <div class="flex gap-2 pt-2">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Input from "../components/Input.vue";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import TableState from "../components/TableState.vue";

const productos = ref([]);
const q = ref("");
const cargando = ref(true);
const showModal = ref(false);
const editing = ref(null);
const form = ref({
  nombre: "",
  sku: "",
  descripcion: "",
  precio: 0,
  activo: true,
});

const fetchProductos = async () => {
  cargando.value = true;
  try {
    const { data } = await axios.get("/api/productos", {
      params: { q: q.value || undefined, limit: 200 },
    });
    productos.value = data || [];
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar productos");
  } finally {
    cargando.value = false;
  }
};

const openModal = (p) => {
  editing.value = p;
  form.value = p
    ? {
        nombre: p.nombre,
        sku: p.sku || "",
        descripcion: p.descripcion || "",
        precio: p.precio,
        activo: p.activo,
      }
    : { nombre: "", sku: "", descripcion: "", precio: 0, activo: true };
  showModal.value = true;
};

const guardar = async () => {
  try {
    if (editing.value)
      await axios.put(`/api/productos/${editing.value.id}`, form.value);
    else await axios.post("/api/productos", form.value);
    showModal.value = false;
    await fetchProductos();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error guardando (¿eres admin?)");
  }
};

const eliminar = async (p) => {
  if (!(await confirmar(`¿Eliminar "${p.nombre}"?`))) return;
  try {
    await axios.delete(`/api/productos/${p.id}`);
    await fetchProductos();
  } catch (e) {
    toast.error(e.response?.data?.error || "Error eliminando (¿eres admin?)");
  }
};

onMounted(async () => {
  await loadCurrency();
  await fetchProductos();
});
</script>
