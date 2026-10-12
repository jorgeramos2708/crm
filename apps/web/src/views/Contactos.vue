<template>
  <div class="p-6">
    <header class="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Contactos</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Personas y sus datos</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative">
          <input
            v-model="q"
            type="search"
            placeholder="Buscar contactos..."
            aria-label="Buscar contactos"
            class="w-56 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 pl-9 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900"
            @input="onBuscar"
          />
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>
        <div class="flex gap-2">
        <Btn href="/api/contactos/export" variant="icon" title="Exportar CSV" aria-label="Exportar CSV">
          <Icon name="download" class="h-4 w-4" />
        </Btn>
        <Btn
          variant="icon"
          title="Importar CSV"
          aria-label="Importar CSV"
          @click="importInput?.click()"
        >
          <Icon name="upload" class="h-4 w-4" />
        </Btn>
        <input
          ref="importInput"
          type="file"
          accept=".csv"
          class="hidden"
          aria-hidden="true"
          tabindex="-1"
          @change="importarCsv"
        />
        <Btn @click="openModal(null)" variant="primary" title="Nuevo Contacto" aria-label="Nuevo Contacto">
          + Nuevo Contacto
        </Btn>
      </div>
      </div>
    </header>
    <p
      v-if="importMsg"
      class="mb-4 text-sm px-4 py-2 rounded-lg"
      :class="
        importOk
          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
      "
    >
      {{ importMsg }}
    </p>

      <Card class="overflow-hidden" data-testid="contactos-table">
        <Table :cols="['18%', '18%', '13%', '18%', '15%', '18%']" class="min-w-[880px]">
          <template #head>
          <tr>
            <Th>Nombre</Th>
            <Th>Email</Th>
            <Th>Teléfono</Th>
            <Th>Empresa</Th>
            <Th>Cargo</Th>
            <Th><span class="sr-only">Acciones</span></Th>
          </tr>
        </template>
        <tr
          v-for="contacto in contactos"
          :key="contacto.id"
          class="hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
        >
          <Td primary :title="contacto.nombre">
            {{ contacto.nombre }}
          </Td>
          <Td :title="contacto.email || ''">
            {{ contacto.email || "-" }}
          </Td>
          <Td>
            {{ contacto.telefono || "-" }}
          </Td>
          <Td>
            {{ contacto.empresa || "-" }}
          </Td>
          <Td>
            {{ contacto.cargo || "-" }}
          </Td>
          <Td align="right" class="font-medium whitespace-nowrap">
            <Btn
              variant="ghost"
              class="mr-1"
              title="Editar"
              :aria-label="'Editar a ' + contacto.nombre"
              @click="openModal(contacto)"
            >
              <Icon name="editar" class="h-4 w-4" />
            </Btn>
            <Btn
              variant="ghost"
              class="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Eliminar"
              :aria-label="'Eliminar a ' + contacto.nombre"
              @click="eliminarContacto(contacto)"
            >
              <Icon name="eliminar" class="h-4 w-4" />
            </Btn>
          </Td>
        </tr>
        <TableState v-if="cargando && !contactos.length" :colspan="6" loading />
        <TableState v-if="!cargando && contactos.length === 0" :colspan="6">
          <EmptyState icon="contactos">
            No hay contactos.
            <template #action>
              <Btn variant="link" @click="openModal(null)">Crea el primero</Btn>
            </template>
          </EmptyState>
        </TableState>
      </Table>

      <Pagination
        v-if="totalPages > 1"
        :page="currentPage"
        :total-pages="totalPages"
        :total="total"
        :page-size="pageSize"
        item-label="contactos"
        @prev="prevPage"
        @next="nextPage"
      >
        <template #controls>
          <Select v-model="sortBy" aria-label="Ordenar contactos" @change="fetchContactos">
            <option value="createdAt">Recientes</option>
            <option value="nombre">Nombre</option>
            <option value="email">Email</option>
          </Select>
        </template>
      </Pagination>
    </Card>

    <!-- Modal Contacto (Crear/Editar) -->
    <Modal :open="showModal" @close="closeModal">
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingContacto ? "Editar Contacto" : "Nuevo Contacto" }}
        </h2>
      </template>
      <form @submit.prevent="guardarContacto" class="space-y-4">
        <Field label="Nombre" required>
          <Input
            v-model="formData.nombre"
            name="nombre"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Email">
          <Input v-model="formData.email" name="email" type="email" class="w-full" />
        </Field>
        <Field label="Teléfono">
          <Input v-model="formData.telefono" name="telefono" type="text" class="w-full" />
        </Field>
        <Field label="Empresa">
          <Input v-model="formData.empresa" name="empresa" type="text" class="w-full" />
        </Field>
        <Field label="Cargo">
          <Input v-model="formData.cargo" name="cargo" type="text" class="w-full" />
        </Field>
        <CustomFields entidad="contacto" v-model="formData.custom" />
        <div class="flex gap-2 pt-4">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="closeModal"
            >Cancelar</Btn
          >
          <Btn
            type="submit"
            class="flex-1"
            :disabled="saving"
            :loading="saving"
            >{{
              saving
                ? editingContacto
                  ? "Guardando..."
                  : "Creando..."
                : editingContacto
                  ? "Guardar"
                  : "Crear"
            }}</Btn
          >
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
import { loadCurrency } from "../utils/currency";
import CustomFields from "../components/CustomFields.vue";
import EmptyState from "../components/EmptyState.vue";
import Btn from "../components/Btn.vue";
import Icon from "../components/Icon.vue";
import Card from "../components/Card.vue";
import Table from "../components/Table.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import Modal from "../components/Modal.vue";
import Th from "../components/Th.vue";
import Td from "../components/Td.vue";
import TableState from "../components/TableState.vue";
import Pagination from "../components/Pagination.vue";

const contactos = ref([]);
const cargando = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingContacto = ref(null);

const formData = ref({
  nombre: "",
  email: "",
  telefono: "",
  empresa: "",
  cargo: "",
  custom: {},
});

// Pagination + búsqueda (q lo filtra el backend)
const currentPage = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = ref(1);
const sortBy = ref("createdAt");
const q = ref("");
const importInput = ref(null);
let buscarTimer = null;

const onBuscar = () => {
  if (buscarTimer) clearTimeout(buscarTimer);
  buscarTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchContactos();
  }, 300);
};

const fetchContactos = async () => {
  cargando.value = true;
  try {
    const response = await axios.get("/api/contactos", {
      params: {
        limit: pageSize,
        offset: (currentPage.value - 1) * pageSize,
        sortBy: sortBy.value,
        q: q.value || undefined,
      },
    });
    const data = response.data.data || response.data;
    contactos.value = data;
    total.value = response.data.total || data.length;
    totalPages.value = Math.ceil(total.value / pageSize);
  } catch (e) {
    console.error("Error fetching contactos:", e);
    toast.error("Error al cargar contactos");
  } finally {
    cargando.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchContactos();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchContactos();
  }
};

const openModal = (contacto) => {
  editingContacto.value = contacto;
  if (contacto) {
    formData.value = { ...contacto, custom: { ...(contacto.custom || {}) } };
  } else {
    formData.value = {
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      cargo: "",
      custom: {},
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingContacto.value = null;
  formData.value = {
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    cargo: "",
    custom: {},
  };
};

const guardarContacto = async () => {
  if (!formData.value.nombre) {
    toast.error("El nombre es obligatorio");
    return;
  }
  saving.value = true;
  try {
    if (editingContacto.value) {
      const response = await axios.put(
        `/api/contactos/${editingContacto.value.id}`,
        formData.value,
      );
      const idx = contactos.value.findIndex(
        (c) => c.id === editingContacto.value.id,
      );
      if (idx !== -1)
        contactos.value[idx] = response.data.data || response.data;
    } else {
      const response = await axios.post("/api/contactos", formData.value);
    }
    closeModal();
    fetchContactos(); // Refresh to get correct pagination
  } catch (e) {
    console.error("Error saving contacto:", e);
    toast.error("Error al guardar contacto");
  } finally {
    saving.value = false;
  }
};

const importMsg = ref("");
const importOk = ref(false);

const importarCsv = async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  importMsg.value = "";
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await axios.post("/api/contactos/import", form);
    importOk.value = true;
    importMsg.value =
      `Importados: ${data.created} creados, ${data.updated} actualizados` +
      (data.totalErrors
        ? `. ${data.totalErrors} errores (${(data.errors || []).slice(0, 3).join(" | ")})`
        : "");
    fetchContactos();
  } catch (e) {
    importOk.value = false;
    importMsg.value = e.response?.data?.error || "Error importando CSV";
  } finally {
    ev.target.value = "";
  }
};

const eliminarContacto = async (contacto) => {
  if (!(await confirmar(`¿Eliminar a ${contacto.nombre}?`))) return;
  try {
    await axios.delete(`/api/contactos/${contacto.id}`);
    fetchContactos(); // Refresh to get correct pagination
  } catch (e) {
    console.error("Error deleting contacto:", e);
    if (!e.response) {
      toast.error(
        "Sin conexión con el servidor (revisa que el API esté arriba) e inténtalo de nuevo",
      );
    } else {
      toast.error(e.response?.data?.error || "Error al eliminar contacto");
    }
  }
};

onMounted(async () => {
  await loadCurrency();
  fetchContactos();
});
</script>
