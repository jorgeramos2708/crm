<template>
  <div class="p-6">
    <header class="mb-6 flex justify-end">
      <Btn @click="openModal(null)">+ Nueva Regla</Btn>
    </header>

    <div class="space-y-4">
      <Card v-for="auto in automatizaciones" :key="auto.id" class="p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3
                class="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {{ auto.nombre }}
              </h3>
              <span
                :class="
                  auto.activo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                "
                class="px-2 py-1 rounded-full text-xs font-medium"
                >{{ auto.activo ? "Activo" : "Inactivo" }}</span
              >
            </div>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              {{ auto.descripcion || "Sin descripción" }}
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span
                class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded"
                >Evento: {{ auto.evento }}</span
              >
              <span
                v-for="cond in auto.condiciones"
                :key="cond.campo"
                class="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded"
                >{{ cond.campo }} {{ cond.operador }} {{ cond.valor }}</span
              >
              <span
                v-for="accion in auto.acciones"
                :key="accion.tipo"
                class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded"
                >{{ accion.tipo }}</span
              >
            </div>
          </div>
          <div class="flex gap-2">
            <Btn
              variant="outline"
              class="text-zinc-600 dark:text-zinc-400"
              @click="openModal(auto)"
              >Editar</Btn
            >
            <button
              @click="eliminarAuto(auto)"
              class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:opacity-90 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Card>

      <Card v-if="cargando && !automatizaciones.length" class="p-6"
        ><Skeleton :filas="3"
      /></Card>
      <Card
        v-if="!cargando && automatizaciones.length === 0"
        class="p-12 text-center"
      >
        <p class="text-zinc-500 dark:text-zinc-400 mb-4">
          No hay automatizaciones configuradas
        </p>
        <Btn @click="openModal(null)" size="lg">Crear primera regla</Btn>
      </Card>
    </div>

    <!-- Modal Automatización (Crear/Editar) -->
    <Modal
      :open="showModal"
      max-width="max-w-2xl"
      content-class="max-h-[90vh] overflow-y-auto"
      @close="closeModal"
    >
      <template #title>
        <h2 class="text-xl font-bold mb-4">
          {{ editingAuto ? "Editar Automatización" : "Nueva Automatización" }}
        </h2>
      </template>
      <form @submit.prevent="guardarAuto" class="space-y-4">
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
            :rows="2"
            class="w-full"
          />
        </Field>
        <Field label="Evento" required>
          <Select v-model="formData.evento" required class="w-full">
            <option value="stage_changed">Cambio de etapa</option>
            <option value="oportunidad_created">Oportunidad creada</option>
            <option value="oportunidad_updated">Oportunidad actualizada</option>
            <option value="contacto_created">Contacto creado</option>
          </Select>
        </Field>
        <div>
          <label class="block text-sm mb-1">Activo</label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="formData.activo"
              type="checkbox"
              class="w-4 h-4 text-blue-600 border-zinc-300 rounded"
            />
            <span class="text-sm text-zinc-600 dark:text-zinc-400"
              >Activado</span
            >
          </label>
        </div>
        <div class="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <h4 class="font-medium mb-2">Condiciones</h4>
          <div
            v-for="(cond, idx) in formData.condiciones"
            :key="idx"
            class="flex gap-2 mb-2"
          >
            <Select v-model="cond.campo" class="flex-1">
              <option value="stage.nombre">Nombre de etapa</option>
              <option value="stage.esFinal">Es etapa final</option>
              <option value="importe">Importe</option>
              <option value="probabilidad">Probabilidad</option>
            </Select>
            <Select v-model="cond.operador" class="flex-1">
              <option value="equals">Igual a</option>
              <option value="not_equals">Distinto de</option>
              <option value="contains">Contiene</option>
              <option value="greater_than">Mayor que</option>
              <option value="less_than">Menor que</option>
            </Select>
            <Input
              v-model="cond.valor"
              type="text"
              placeholder="Valor"
              class="flex-1"
            />
            <button
              type="button"
              @click="formData.condiciones.splice(idx, 1)"
              class="px-3 py-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
          <Btn
            type="button"
            variant="link"
            @click="
              formData.condiciones.push({
                campo: '',
                operador: 'equals',
                valor: '',
              })
            "
            >+ Agregar condición</Btn
          >
        </div>
        <div class="border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <h4 class="font-medium mb-2">Acciones</h4>
          <div
            v-for="(accion, idx) in formData.acciones"
            :key="idx"
            class="flex gap-2 mb-2"
          >
            <select
              v-model="accion.tipo"
              class="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
            >
              <option value="send_email">Enviar email</option>
              <option value="create_task">Crear tarea</option>
              <option value="update_field">Actualizar campo</option>
              <option value="move_stage">Mover etapa</option>
              <option value="webhook">Webhook</option>
              <option value="notify">Notificación</option>
            </select>
            <input
              v-model="accion.template"
              placeholder="Plantilla (para email)"
              class="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
            />
            <button
              type="button"
              @click="formData.acciones.splice(idx, 1)"
              class="px-3 py-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            @click="
              formData.acciones.push({ tipo: 'send_email', template: '' })
            "
            class="text-sm text-blue-600 hover:underline"
          >
            + Agregar acción
          </button>
        </div>
        <div
          class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700"
        >
          <button
            type="button"
            @click="closeModal"
            class="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {{
              saving
                ? editingAuto
                  ? "Guardando..."
                  : "Creando..."
                : editingAuto
                  ? "Guardar"
                  : "Crear"
            }}
          </button>
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
import Select from "../components/Select.vue";

const automatizaciones = ref([]);
const cargando = ref(true);
const showModal = ref(false);
const saving = ref(false);
const editingAuto = ref(null);

const formData = ref({
  nombre: "",
  descripcion: "",
  evento: "stage_changed",
  condiciones: [],
  acciones: [],
  activo: true,
});

const fetchAutos = async () => {
  try {
    const response = await axios.get("/api/automatizaciones");
    automatizaciones.value = response.data.data || response.data;
  } catch (e) {
    console.error("Error fetching automatizaciones:", e);
    toast.error("Error al cargar automatizaciones");
  } finally {
    cargando.value = false;
  }
};

const openModal = (auto) => {
  editingAuto.value = auto;
  if (auto) {
    formData.value = { ...auto };
  } else {
    formData.value = {
      nombre: "",
      descripcion: "",
      evento: "stage_changed",
      condiciones: [],
      acciones: [],
      activo: true,
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingAuto.value = null;
  formData.value = {
    nombre: "",
    descripcion: "",
    evento: "stage_changed",
    condiciones: [],
    acciones: [],
    activo: true,
  };
};

const guardarAuto = async () => {
  if (!formData.value.nombre || !formData.value.evento) {
    toast.error("Nombre y evento son obligatorios");
    return;
  }
  saving.value = true;
  try {
    if (editingAuto.value) {
      const response = await axios.put(
        `/api/automatizaciones/${editingAuto.value.id}`,
        formData.value,
      );
      const idx = automatizaciones.value.findIndex(
        (a) => a.id === editingAuto.value.id,
      );
      if (idx !== -1)
        automatizaciones.value[idx] = response.data.data || response.data;
    } else {
      const response = await axios.post(
        "/api/automatizaciones",
        formData.value,
      );
      automatizaciones.value.unshift(response.data.data || response.data);
    }
    closeModal();
  } catch (e) {
    console.error("Error saving automatizacion:", e);
    toast.error("Error al guardar automatización");
  } finally {
    saving.value = false;
  }
};

const eliminarAuto = async (auto) => {
  if (!(await confirmar(`¿Eliminar la regla "${auto.nombre}"?`))) return;
  try {
    await axios.delete(`/api/automatizaciones/${auto.id}`);
    automatizaciones.value = automatizaciones.value.filter(
      (a) => a.id !== auto.id,
    );
  } catch (e) {
    console.error("Error deleting automatizacion:", e);
    toast.error("Error al eliminar automatización");
  }
};

onMounted(() => {
  fetchAutos();
});
</script>
