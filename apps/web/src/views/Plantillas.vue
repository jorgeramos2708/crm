<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <Btn @click="openModal(null)">+ Nueva Plantilla</Btn>
    </header>

    <div class="space-y-4">
      <Card v-for="tpl in plantillas" :key="tpl.id" class="p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {{ tpl.nombre }}
            </h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Asunto: {{ tpl.asunto }}
            </p>
            <div class="flex flex-wrap gap-2 mt-2">
              <Badge
                v-for="v in tpl.variables"
                :key="v"
                color="zinc"
                variant="pill"
                :dot="false"
                >{{ v }}</Badge
              >
            </div>
          </div>
          <div class="flex gap-2">
            <Btn
              variant="outline"
              class="text-zinc-600 dark:text-zinc-400"
              @click="openModal(tpl)"
            >
              Editar
            </Btn>
            <button
              @click="eliminarTemplate(tpl)"
              class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:opacity-90 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Card>

      <Card v-if="cargando && !plantillas.length" class="p-6">
        <Skeleton :filas="3" />
      </Card>
      <Card
        v-if="!cargando && plantillas.length === 0"
        class="p-12 text-center"
      >
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">
          No hay plantillas creadas
        </p>
        <Btn @click="openModal(null)" size="lg">Crear primera plantilla</Btn>
      </Card>
    </div>

    <!-- Modal Plantilla (Crear/Editar) -->
    <Modal
      :open="showModal"
      max-width="max-w-2xl"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="closeModal"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingTemplate ? "Editar Plantilla" : "Nueva Plantilla" }}
        </h2>
      </template>
      <form @submit.prevent="guardarTemplate" class="space-y-4">
        <Field label="Nombre" required>
          <Input
            v-model="formData.nombre"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Asunto" required>
          <Input
            v-model="formData.asunto"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Contenido" required>
          <Input
            v-model="formData.contenidoTexto"
            multiline
            required
            class="w-full"
            :rows="8"
          />
          <p class="text-xs text-zinc-500 mt-1">
            Usa {{ variable }} para variables dinámicas. Se convierte a email
            con formato automáticamente.
          </p>
        </Field>
        <Field label="Variables (separadas por coma)">
          <Input
            v-model="variablesInput"
            type="text"
            placeholder="nombre, empresa, importe"
            class="w-full"
          />
        </Field>
        <div
          class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700"
        >
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
                ? editingTemplate
                  ? "Guardando..."
                  : "Creando..."
                : editingTemplate
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
import Input from "../components/Input.vue";
import Btn from "../components/Btn.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";

const plantillas = ref([]);
const cargando = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingTemplate = ref(null);

const variablesInput = ref("");

const formData = ref({
  nombre: "",
  asunto: "",
  contenidoHtml: "",
  contenidoTexto: "",
  variables: [],
});

const fetchTemplates = async () => {
  try {
    const response = await axios.get("/api/email-templates");
    plantillas.value = response.data.data || response.data;
  } catch (e) {
    console.error("Error fetching templates:", e);
    toast.error("Error al cargar plantillas");
  } finally {
    cargando.value = false;
  }
};

const openModal = (tpl) => {
  editingTemplate.value = tpl;
  if (tpl) {
    formData.value = { ...tpl };
    variablesInput.value = tpl.variables?.join(", ") || "";
  } else {
    formData.value = {
      nombre: "",
      asunto: "",
      contenidoHtml: "",
      contenidoTexto: "",
      variables: [],
    };
    variablesInput.value = "";
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTemplate.value = null;
  formData.value = {
    nombre: "",
    asunto: "",
    contenidoHtml: "",
    contenidoTexto: "",
    variables: [],
  };
  variablesInput.value = "";
};

const textoAHtml = (texto) => {
  const esc = String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div>${esc.split("\n").join("<br>")}</div>`;
};

const guardarTemplate = async () => {
  if (
    !formData.value.nombre ||
    !formData.value.asunto ||
    !formData.value.contenidoTexto
  ) {
    toast.error("Nombre, asunto y contenido son obligatorios");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...formData.value,
      contenidoHtml: textoAHtml(formData.value.contenidoTexto),
      variables: variablesInput.value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    if (editingTemplate.value) {
      const response = await axios.put(
        `/api/email-templates/${editingTemplate.value.id}`,
        payload,
      );
      const idx = plantillas.value.findIndex(
        (t) => t.id === editingTemplate.value.id,
      );
      if (idx !== -1)
        plantillas.value[idx] = response.data.data || response.data;
    } else {
      const response = await axios.post("/api/email-templates", payload);
      plantillas.value.unshift(response.data.data || response.data);
    }
    closeModal();
  } catch (e) {
    console.error("Error saving template:", e);
    toast.error("Error al guardar plantilla");
  } finally {
    saving.value = false;
  }
};

const eliminarTemplate = async (tpl) => {
  if (!(await confirmar(`¿Eliminar la plantilla "${tpl.nombre}"?`))) return;
  try {
    await axios.delete(`/api/email-templates/${tpl.id}`);
    plantillas.value = plantillas.value.filter((t) => t.id !== tpl.id);
  } catch (e) {
    console.error("Error deleting template:", e);
    toast.error("Error al eliminar plantilla");
  }
};

onMounted(() => {
  fetchTemplates();
});
</script>
