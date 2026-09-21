<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <Btn @click="openModal(null)">+ Nueva Lista</Btn>
    </header>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="lista in listas" :key="lista.id" class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {{ lista.nombre }}
            </h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {{ lista.descripcion || "Sin descripción" }}
            </p>
          </div>
        </div>
        <div
          class="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-4"
        >
          <span>{{ (lista.members || []).length }} contactos</span>
        </div>
        <div class="flex gap-2">
          <Btn variant="secondary" class="flex-1" :to="`/listas/${lista.id}`"
            >Ver contactos</Btn
          >
          <Btn
            variant="outline"
            class="text-zinc-600 dark:text-zinc-400"
            @click="openModal(lista)"
            >Editar</Btn
          >
          <button
            @click="eliminarLista(lista)"
            class="px-4 py-2 text-center text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
          >
            Eliminar
          </button>
        </div>
      </Card>

      <Card v-if="cargando && !listas.length" class="col-span-full p-6"
        ><Skeleton :filas="3"
      /></Card>
      <Card
        v-if="!cargando && listas.length === 0"
        class="col-span-full p-12 text-center"
      >
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">
          No hay listas creadas
        </p>
        <Btn @click="openModal(null)" size="lg">Crear primera lista</Btn>
      </Card>
    </div>

    <!-- Modal Lista (Crear/Editar) -->
    <Modal :open="showModal" @close="closeModal">
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingLista ? "Editar Lista" : "Nueva Lista" }}
        </h2>
      </template>
      <form @submit.prevent="guardarLista" class="space-y-4">
        <Field label="Nombre" required>
          <Input
            v-model="formData.nombre"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Descripción">
          <Input
            v-model="formData.descripcion"
            multiline
            :rows="3"
            class="w-full"
          />
        </Field>
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
                ? editingLista
                  ? "Guardando..."
                  : "Creando..."
                : editingLista
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
import Skeleton from "../components/Skeleton.vue";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";
import Btn from "../components/Btn.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";

const listas = ref([]);
const cargando = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingLista = ref(null);

const formData = ref({ nombre: "", descripcion: "" });

const fetchListas = async () => {
  try {
    const response = await axios.get("/api/contact-lists");
    listas.value = response.data.data || response.data;
  } catch (e) {
    console.error("Error fetching listas:", e);
    toast.error("Error al cargar listas");
  } finally {
    cargando.value = false;
  }
};

const openModal = (lista) => {
  editingLista.value = lista;
  if (lista) {
    formData.value = { ...lista };
  } else {
    formData.value = { nombre: "", descripcion: "" };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingLista.value = null;
  formData.value = { nombre: "", descripcion: "" };
};

const guardarLista = async () => {
  if (!formData.value.nombre) {
    toast.error("El nombre es obligatorio");
    return;
  }
  saving.value = true;
  try {
    if (editingLista.value) {
      const response = await axios.put(
        `/api/contact-lists/${editingLista.value.id}`,
        formData.value,
      );
      const idx = listas.value.findIndex((l) => l.id === editingLista.value.id);
      if (idx !== -1) listas.value[idx] = response.data.data || response.data;
    } else {
      const response = await axios.post("/api/contact-lists", formData.value);
      listas.value.unshift(response.data.data || response.data);
    }
    closeModal();
  } catch (e) {
    console.error("Error saving lista:", e);
    toast.error("Error al guardar lista");
  } finally {
    saving.value = false;
  }
};

const eliminarLista = async (lista) => {
  if (!(await confirmar(`¿Eliminar la lista "${lista.nombre}"?`))) return;
  try {
    await axios.delete(`/api/contact-lists/${lista.id}`);
    listas.value = listas.value.filter((l) => l.id !== lista.id);
  } catch (e) {
    console.error("Error deleting lista:", e);
    toast.error("Error al eliminar lista");
  }
};

onMounted(() => {
  fetchListas();
});
</script>
