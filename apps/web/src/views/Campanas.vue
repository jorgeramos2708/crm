<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <Btn @click="openModal(null)">+ Nueva Campaña</Btn>
    </header>

    <div class="space-y-4">
      <Card v-for="campaign in campanas" :key="campaign.id" class="p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3
                class="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {{ campaign.nombre }}
              </h3>
              <Badge
                :color="colorEstado[campaign.estado] || 'zinc'"
                variant="pill"
                :dot="false"
              >
                {{ campaign.estado }}
              </Badge>
            </div>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              Asunto: {{ campaign.asunto }}
            </p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">
              De: {{ campaign.remitenteNombre }} <{{ campaign.remitenteEmail }}>
            </p>
            <div
              class="flex gap-4 mt-3 text-sm text-zinc-500 dark:text-zinc-400"
            >
              <span>Plantilla: {{ campaign.templateId || "N/A" }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button
              v-if="campaign.estado === 'borrador'"
              @click="enviarCampana(campaign.id)"
              class="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:opacity-90 text-sm"
            >
              Enviar
            </button>
            <Btn
              variant="outline"
              class="text-zinc-600 dark:text-zinc-400"
              @click="openModal(campaign)"
              >Editar</Btn
            >
            <button
              @click="eliminarCampana(campaign)"
              class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:opacity-90 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Card>

      <Card v-if="cargando && !campanas.length" class="p-6"
        ><Skeleton :filas="3"
      /></Card>
      <Card v-if="!cargando && campanas.length === 0" class="p-12 text-center">
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">
          No hay campañas creadas
        </p>
        <Btn @click="openModal(null)" size="lg">Crear primera campaña</Btn>
      </Card>
    </div>

    <!-- Modal Campaña (Crear/Editar) -->
    <Modal
      :open="showModal"
      max-width="max-w-2xl"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="closeModal"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingCampaign ? "Editar Campaña" : "Nueva Campaña" }}
        </h2>
      </template>
      <form @submit.prevent="guardarCampana" class="space-y-4">
        <Field label="Nombre" required>
          <Input
            v-model="formData.nombre"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <div class="grid gap-4 md:grid-cols-2">
          <Field label="Remitente Nombre" required>
            <Input
              v-model="formData.remitenteNombre"
              type="text"
              required
              class="w-full"
            />
          </Field>
          <Field label="Remitente Email" required>
            <Input
              v-model="formData.remitenteEmail"
              type="email"
              required
              class="w-full"
            />
          </Field>
        </div>
        <Field label="Asunto" required>
          <Input
            v-model="formData.asunto"
            type="text"
            required
            class="w-full"
          />
        </Field>
        <Field label="Plantilla" required>
          <Select v-model="formData.templateId" required class="w-full">
            <option value="">Seleccionar plantilla</option>
            <option v-for="t in plantillas" :key="t.id" :value="t.id">
              {{ t.nombre }} ({{ t.asunto }})
            </option>
          </Select>
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
                ? editingCampaign
                  ? "Guardando..."
                  : "Creando..."
                : editingCampaign
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
import Badge from "../components/Badge.vue";
import Card from "../components/Card.vue";
import Modal from "../components/Modal.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Select from "../components/Select.vue";

const campanas = ref([]);
const plantillas = ref([]);
const cargando = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingCampaign = ref(null);

const formData = ref({
  nombre: "",
  templateId: "",
  remitenteNombre: "",
  remitenteEmail: "",
  asunto: "",
  estado: "borrador",
});

const fetchData = async () => {
  try {
    const [campanasRes, plantillasRes] = await Promise.all([
      axios.get("/api/email-campaigns"),
      axios.get("/api/email-templates"),
    ]);
    campanas.value = campanasRes.data.data || campanasRes.data;
    plantillas.value = plantillasRes.data.data || plantillasRes.data;
  } catch (e) {
    console.error("Error fetching data:", e);
    toast.error("Error al cargar campañas");
  } finally {
    cargando.value = false;
  }
};

const colorEstado = {
  borrador: "zinc",
  enviada: "green",
  programada: "blue",
  enviando: "yellow",
};

const openModal = (campaign) => {
  editingCampaign.value = campaign;
  if (campaign) {
    formData.value = { ...campaign };
  } else {
    formData.value = {
      nombre: "",
      templateId: "",
      remitenteNombre: "",
      remitenteEmail: "",
      asunto: "",
      estado: "borrador",
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingCampaign.value = null;
  formData.value = {
    nombre: "",
    templateId: "",
    remitenteNombre: "",
    remitenteEmail: "",
    asunto: "",
    estado: "borrador",
  };
};

const guardarCampana = async () => {
  if (
    !formData.value.nombre ||
    !formData.value.templateId ||
    !formData.value.remitenteNombre ||
    !formData.value.remitenteEmail ||
    !formData.value.asunto
  ) {
    toast.error("Todos los campos son obligatorios");
    return;
  }
  saving.value = true;
  try {
    if (editingCampaign.value) {
      const response = await axios.put(
        `/api/email-campaigns/${editingCampaign.value.id}`,
        formData.value,
      );
      const idx = campanas.value.findIndex(
        (c) => c.id === editingCampaign.value.id,
      );
      if (idx !== -1) campanas.value[idx] = response.data.data || response.data;
    } else {
      const response = await axios.post("/api/email-campaigns", formData.value);
      campanas.value.unshift(response.data.data || response.data);
    }
    closeModal();
  } catch (e) {
    console.error("Error saving campaign:", e);
    toast.error("Error al guardar campaña");
  } finally {
    saving.value = false;
  }
};

const eliminarCampana = async (campaign) => {
  if (!(await confirmar(`¿Eliminar la campaña "${campaign.nombre}"?`))) return;
  try {
    await axios.delete(`/api/email-campaigns/${campaign.id}`);
    campanas.value = campanas.value.filter((c) => c.id !== campaign.id);
  } catch (e) {
    console.error("Error deleting campaign:", e);
    toast.error("Error al eliminar campaña");
  }
};

const enviarCampana = async (id) => {
  if (!(await confirmar("¿Enviar esta campaña a todos los contactos?"))) return;
  try {
    await axios.post(`/api/email-campaigns/${id}/send`);
    const campana = campanas.value.find((c) => c.id === id);
    if (campana) campana.estado = "enviada";
    toast.exito("Campaña enviada");
  } catch (e) {
    console.error("Error sending campaign:", e);
    toast.error("Error al enviar campaña");
  }
};

onMounted(() => {
  fetchData();
});
</script>
