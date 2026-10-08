<template>
  <div class="p-6">
    <header class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Programador de Reuniones</h1>
      <Btn @click="openModal(null)" variant="primary" icon="plus">
        Nuevo Tipo de Reunión
      </Btn>
    </header>

    <Card class="p-6">
      <div v-if="loading" class="text-sm text-zinc-500">Cargando...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
            <th class="py-2 pr-3">Nombre</th>
            <th class="py-2 pr-3">Duración</th>
            <th class="py-2 pr-3">Buffer (antes/después)</th>
            <th class="py-2 pr-3">Días antelación (min/max)</th>
            <th class="py-2 pr-3">Zona horaria</th>
            <th class="py-2 pr-3">Slug público</th>
            <th class="py-2 pr-3">Estado</th>
            <th class="py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="mt in meetingTypes"
            :key="mt.id"
            class="border-b border-zinc-100 dark:border-zinc-800"
          >
            <td class="py-2 pr-3">
              <div class="font-medium">{{ mt.nombre }}</div>
              <div v-if="mt.descripcion" class="text-xs text-zinc-500 truncate max-w-xs">{{ mt.descripcion }}</div>
            </td>
            <td class="py-2 pr-3">
              <Badge color="blue" variant="pill">{{ mt.duracionMin }} min</Badge>
            </td>
            <td class="py-2 pr-3 text-sm">
              {{ mt.bufferAntesMin }} / {{ mt.bufferDespuesMin }} min
            </td>
            <td class="py-2 pr-3 text-sm">
              {{ mt.diasAntelacionMin }} / {{ mt.diasAntelacionMax }} días
            </td>
            <td class="py-2 pr-3">{{ mt.zonaHoraria }}</td>
            <td class="py-2 pr-3 font-mono text-sm">{{ mt.slug }}</td>
            <td class="py-2 pr-3">
              <Badge
                :color="mt.activo ? 'green' : 'zinc'"
                variant="pill"
              >{{ mt.activo ? 'Activo' : 'Inactivo' }}</Badge>
            </td>
            <td class="py-2 text-right">
              <div class="flex items-center justify-end gap-1">
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="external-link"
                  @click="openPublicLink(mt)"
                  title="Ver página pública"
                />
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="calendar-plus"
                  @click="openSlotsModal(mt)"
                  title="Generar slots"
                />
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  @click="openModal(mt)"
                  title="Editar"
                />
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  class="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  @click="deleteMeetingType(mt)"
                  title="Eliminar"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !meetingTypes.length">
            <td colspan="8" class="py-8 text-center text-zinc-500">
              <p class="mb-2">No hay tipos de reunión creados</p>
              <Btn @click="openModal(null)" variant="primary" icon="plus">
                Crear el primero
              </Btn>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>

    <!-- Modal Crear/Editar Tipo de Reunión -->
    <Modal
      :open="showModal"
      max-width="2xl"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="closeModal"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingMeetingType ? "Editar Tipo de Reunión" : "Nuevo Tipo de Reunión" }}
        </h2>
      </template>
      <form @submit.prevent="saveMeetingType" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <Input
              v-model="form.nombre"
              type="text"
              required
              class="w-full"
              placeholder="Reunión de descubrimiento"
            />
          </Field>

          <Field label="Slug (URL pública)" required>
            <Input
              v-model="form.slug"
              type="text"
              required
              class="w-full font-mono text-sm"
              placeholder="reunion-descubrimiento"
            />
            <p class="text-xs text-zinc-500 mt-1">Solo minúsculas, números y guiones. Se usa en la URL pública.</p>
          </Field>
        </div>

        <Field label="Descripción">
          <Input
            v-model="form.descripcion"
            multiline
            :rows="3"
            class="w-full"
            placeholder="Descripción opcional..."
          />
        </Field>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Duración (min)" required>
            <Input
              v-model="form.duracionMin"
              type="number"
              min="15"
              max="480"
              required
              class="w-full"
              @input="form.duracionMin = Math.max(15, Math.min(480, parseInt(form.duracionMin) || 30))"
            />
          </Field>

          <Field label="Buffer antes (min)">
            <Input
              v-model="form.bufferAntesMin"
              type="number"
              min="0"
              max="60"
              class="w-full"
            />
          </Field>

          <Field label="Buffer después (min)">
            <Input
              v-model="form.bufferDespuesMin"
              type="number"
              min="0"
              max="60"
              class="w-full"
            />
          </Field>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Días antelación mínima">
            <Input
              v-model="form.diasAntelacionMin"
              type="number"
              min="0"
              max="365"
              class="w-full"
            />
          </Field>

          <Field label="Días antelación máxima">
            <Input
              v-model="form.diasAntelacionMax"
              type="number"
              min="1"
              max="365"
              class="w-full"
            />
          </Field>

          <Field label="Zona horaria">
            <Select
              v-model="form.zonaHoraria"
              :options="timezones"
              @update:modelValue="v => form.zonaHoraria = v"
              class="w-full"
            />
          </Field>
        </div>

        <Field label="Preguntas personalizadas (JSON)">
          <Input
            v-model="form.preguntasJson"
            multiline
            :rows="6"
            class="w-full font-mono text-sm"
            placeholder='[{"label": "Teléfono", "type": "phone", "required": true}, {"label": "Empresa", "type": "text", "required": false}]'
            @input="validatePreguntas"
          />
          <p v-if="preguntasError" class="text-xs text-red-600 mt-1">{{ preguntasError }}</p>
          <p class="text-xs text-zinc-500 mt-1">Array de objetos: label, type (text|email|phone|textarea), required</p>
        </Field>

        <Field label="Activo">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="form.activo"
              class="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label class="text-sm">Habilitar este tipo de reunión</label>
          </div>
        </Field>

        <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
            :disabled="saving || preguntasError"
            :loading="saving"
            >{{ saving ? "Guardando..." : (editingMeetingType ? "Guardar" : "Crear") }}</Btn
          >
        </div>
      </form>
    </Modal>

    <!-- Modal Generar Slots -->
    <Modal
      :open="showSlotsModal"
      max-width="lg"
      @close="closeSlotsModal"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">Generar Slots para {{ selectedMeetingType?.nombre }}</h2>
      </template>
      <form @submit.prevent="generateSlots" class="space-y-4">
        <Field label="Fecha inicio" required>
          <Input
            v-model="slotsForm.inicio"
            type="datetime-local"
            required
            class="w-full"
          />
        </Field>

        <Field label="Fecha fin" required>
          <Input
            v-model="slotsForm.fin"
            type="datetime-local"
            required
            class="w-full"
          />
        </Field>

        <Field label="Días hacia adelante (opcional)">
          <Input
            v-model="slotsForm.daysAhead"
            type="number"
            min="1"
            max="365"
            class="w-full"
            placeholder="60"
          />
        </Field>

        <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <Btn
            type="button"
            variant="outline"
            class="flex-1"
            @click="closeSlotsModal"
            >Cancelar</Btn
          >
          <Btn
            type="submit"
            class="flex-1"
            :loading="generatingSlots"
            >{{ generatingSlots ? "Generando..." : "Generar Slots" }}</Btn
          >
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import Btn from "../components/Btn.vue";
import Icon from "../components/Icon.vue";
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";
import { toast } from "../utils/toast";
import { confirmar } from "../utils/confirm";

const meetingTypes = ref([]);
const loading = ref(true);
const showModal = ref(false);
const showSlotsModal = ref(false);
const editingMeetingType = ref(null);
const selectedMeetingType = ref(null);
const saving = ref(false);
const generatingSlots = ref(false);
const preguntasError = ref(null);

const form = ref({
  nombre: "",
  descripcion: "",
  duracionMin: 30,
  bufferAntesMin: 5,
  bufferDespuesMin: 5,
  diasAntelacionMin: 1,
  diasAntelacionMax: 60,
  zonaHoraria: "America/Mexico_City",
  preguntasJson: '[]',
  slug: "",
  activo: true,
});

const slotsForm = ref({
  inicio: "",
  fin: "",
  daysAhead: 60,
});

const timezones = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Argentina/Buenos_Aires",
  "America/Santiago",
  "America/Caracas",
  "Europe/Madrid",
  "UTC",
];

function validatePreguntas() {
  try {
    JSON.parse(form.value.preguntasJson);
    preguntasError.value = null;
  } catch (e) {
    preguntasError.value = "JSON inválido: " + e.message;
  }
}

const loadMeetingTypes = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get("/api/reuniones/tipos");
    meetingTypes.value = data.data || data;
  } catch (e) {
    console.error(e);
    toast.error("Error al cargar tipos de reunión");
  } finally {
    loading.value = false;
  }
};

const openModal = (mt) => {
  if (mt) {
    editingMeetingType.value = mt;
    form.value = {
      nombre: mt.nombre,
      descripcion: mt.descripcion || "",
      duracionMin: mt.duracionMin,
      bufferAntesMin: mt.bufferAntesMin,
      bufferDespuesMin: mt.bufferDespuesMin,
      diasAntelacionMin: mt.diasAntelacionMin,
      diasAntelacionMax: mt.diasAntelacionMax,
      zonaHoraria: mt.zonaHoraria,
      preguntasJson: JSON.stringify(mt.preguntas || [], null, 2),
      slug: mt.slug,
      activo: mt.activo,
    };
  } else {
    editingMeetingType.value = null;
    form.value = {
      nombre: "",
      descripcion: "",
      duracionMin: 30,
      bufferAntesMin: 5,
      bufferDespuesMin: 5,
      diasAntelacionMin: 1,
      diasAntelacionMax: 60,
      zonaHoraria: "America/Mexico_City",
      preguntasJson: '[]',
      slug: "",
      activo: true,
    };
  }
  preguntasError.value = null;
  validatePreguntas();
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingMeetingType.value = null;
};

const openSlotsModal = (mt) => {
  selectedMeetingType.value = mt;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  slotsForm.value = {
    inicio: tomorrow.toISOString().slice(0, 16),
    fin: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    daysAhead: 60,
  };
  showSlotsModal.value = true;
};

const closeSlotsModal = () => {
  showSlotsModal.value = false;
  selectedMeetingType.value = null;
};

const saveMeetingType = async () => {
  if (preguntasError.value) return;
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      preguntas: JSON.parse(form.value.preguntasJson),
    };
    if (editingMeetingType.value) {
      await axios.put(`/api/reuniones/tipos/${editingMeetingType.value.id}`, payload);
      toast.success("Tipo de reunión actualizado");
    } else {
      await axios.post("/api/reuniones/tipos", payload);
      toast.success("Tipo de reunión creado");
    }
    closeModal();
    await loadMeetingTypes();
  } catch (e) {
    console.error(e);
    toast.error("Error al guardar tipo de reunión");
  } finally {
    saving.value = false;
  }
};

const deleteMeetingType = async (mt) => {
  if (!(await confirmar(`¿Eliminar el tipo de reunión "${mt.nombre}"?`))) return;
  try {
    await axios.delete(`/api/reuniones/tipos/${mt.id}`);
    toast.success("Tipo de reunión eliminado");
    await loadMeetingTypes();
  } catch (e) {
    console.error(e);
    toast.error("Error al eliminar tipo de reunión");
  }
};

const generateSlots = async () => {
  generatingSlots.value = true;
  try {
    await axios.post(`/api/reuniones/tipos/${selectedMeetingType.value.id}/generar-slots`, {
      inicio: slotsForm.value.inicio,
      fin: slotsForm.value.fin,
      daysAhead: slotsForm.value.daysAhead,
    });
    toast.success("Slots generados correctamente");
    closeSlotsModal();
  } catch (e) {
    console.error(e);
    toast.error("Error al generar slots");
  } finally {
    generatingSlots.value = false;
  }
};

const openPublicLink = (mt) => {
  const url = `${window.location.origin}/agendar/${mt.slug}`;
  navigator.clipboard.writeText(url);
  toast.success("Enlace público copiado al portapapeles");
};

onMounted(() => {
  loadMeetingTypes();
});
</script>

<style scoped>
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  opacity: 1;
}
</style>