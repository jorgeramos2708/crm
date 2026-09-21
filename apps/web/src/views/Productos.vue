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
        <button
          @click="openModal(null)"
          class="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          + Nuevo Producto
        </button>
      </div>
    </div>

    <div class="panel-flat overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-zinc-50 dark:bg-zinc-700/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Producto
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                SKU
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Precio
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <tr
              v-for="p in productos"
              :key="p.id"
              class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            >
              <td class="px-6 py-4 text-sm font-medium">
                {{ p.nombre }}
                <div
                  v-if="p.descripcion"
                  class="font-normal text-xs text-zinc-500 truncate max-w-xs"
                >
                  {{ p.descripcion }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-zinc-500 font-mono text-xs">
                {{ p.sku || "—" }}
              </td>
              <td class="px-6 py-4 text-sm text-right tabular-nums">
                {{ formatCurrency(p.precio) }}
              </td>
              <td class="px-6 py-4 text-sm">
                {{ p.activo ? "Activo" : "Inactivo" }}
              </td>
              <td class="px-6 py-4 text-right text-sm">
                <button
                  @click="openModal(p)"
                  class="text-blue-600 hover:underline mr-3"
                >
                  Editar
                </button>
                <button
                  @click="eliminar(p)"
                  class="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="cargando && !productos.length">
              <td colspan="5">
                <div class="p-4"><Skeleton :filas="5" /></div>
              </td>
            </tr>
            <tr v-if="!cargando && !productos.length">
              <td
                colspan="5"
                class="px-6 py-12 text-center text-sm text-zinc-500"
              >
                Sin productos en el catálogo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editing ? "Editar Producto" : "Nuevo Producto" }}
        </h2>
        <form @submit.prevent="guardar" class="space-y-4">
          <div>
            <label class="block text-sm mb-1">Nombre *</label>
            <input
              v-model="form.nombre"
              type="text"
              required
              class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm mb-1">SKU</label>
              <input
                v-model="form.sku"
                type="text"
                class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 font-mono text-sm"
              />
            </div>
            <div>
              <label class="block text-sm mb-1">Precio *</label>
              <input
                v-model.number="form.precio"
                type="number"
                min="0"
                required
                class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm mb-1">Descripción</label>
            <textarea
              v-model="form.descripcion"
              rows="2"
              class="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
            ></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm cursor-pointer"
            ><input type="checkbox" v-model="form.activo" class="w-4 h-4" />
            Activo</label
          >
          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="showModal = false"
              class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import { formatCurrency, loadCurrency } from "../utils/currency";
import Skeleton from "../components/Skeleton.vue";
import Input from "../components/Input.vue";

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
