<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Loading / Error -->
      <div v-if="loading" class="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-zinc-600 dark:text-zinc-400">Cargando información de la reunión...</p>
      </div>

      <div v-else-if="error" class="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-12 text-center">
        <Icon name="alert-circle" class="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No disponible</h2>
        <p class="text-zinc-600 dark:text-zinc-400 mb-6">{{ error }}</p>
        <Btn variant="outline" @click="goBack">Volver</Btn>
      </div>

      <!-- Meeting Info & Booking Form -->
      <template v-else>
        <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold mb-2">{{ meetingType.nombre }}</h1>
                <p v-if="meetingType.descripcion" class="text-blue-100">{{ meetingType.descripcion }}</p>
              </div>
              <div class="text-right">
                <div class="text-sm opacity-90">{{ meetingType.duracionMin }} minutos</div>
                <div class="text-xs opacity-70">{{ meetingType.zonaHoraria }}</div>
              </div>
            </div>
          </div>

          <!-- Calendar / Slot Selection -->
          <div class="p-6">
            <div class="mb-6">
              <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Seleccionar fecha
              </label>
              <div class="flex gap-2">
                <Input
                  v-model="selectedDate"
                  type="date"
                  :min="minDate"
                  :max="maxDate"
                  class="flex-1"
                  @change="loadSlotsForDate"
                />
                <Btn variant="outline" @click="prevWeek" icon="chevron-left" />
                <Btn variant="outline" @click="nextWeek" icon="chevron-right" />
              </div>
              <p class="text-xs text-zinc-500 mt-1">
                Disponibilidad: {{ minDateDisplay }} - {{ maxDateDisplay }}
              </p>
            </div>

            <!-- Week View -->
            <div v-if="slots.length === 0" class="text-center py-12">
              <Icon name="calendar-x" class="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p class="text-zinc-600 dark:text-zinc-400">No hay horarios disponibles para esta fecha</p>
              <p class="text-sm text-zinc-500 mt-1">Intenta con otra fecha</p>
            </div>

            <div v-else class="space-y-4">
              <template v-for="daySlots in groupedSlots" :key="daySlots.date">
                <div class="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  <div class="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 class="font-medium text-zinc-900 dark:text-zinc-100">{{ formatDay(daySlots.date) }}</h3>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                    <button
                      v-for="slot in daySlots.slots"
                      :key="slot.id"
                      @click="selectSlot(slot)"
                      :class="[
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        selectedSlot?.id === slot.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-zinc-200 dark:border-zinc-700'
                      ]"
                      class="w-full text-left"
                    >
                      <div class="font-medium">{{ formatTime(slot.inicio) }}</div>
                      <div class="text-xs opacity-70">{{ formatTime(slot.fin) }} · {{ meetingType.duracionMin }} min</div>
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Booking Form -->
          <div v-if="selectedSlot" class="border-t border-zinc-200 dark:border-zinc-700 p-6 bg-zinc-50 dark:bg-zinc-800/50">
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Confirmar reserva para {{ formatTime(selectedSlot.inicio) }} - {{ formatTime(selectedSlot.fin) }}
            </h3>

            <form @submit.prevent="submitBooking" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombre completo" required>
                  <Input
                    v-model="bookingForm.nombre"
                    type="text"
                    required
                    class="w-full"
                    placeholder="Juan Pérez"
                  />
                </Field>

                <Field label="Email" required>
                  <Input
                    v-model="bookingForm.email"
                    type="email"
                    required
                    class="w-full"
                    placeholder="juan@ejemplo.com"
                  />
                </Field>
              </div>

              <Field label="Teléfono (opcional)">
                <Input
                  v-model="bookingForm.telefono"
                  type="tel"
                  class="w-full"
                  placeholder="+52 55 1234 5678"
                />
              </Field>

              <!-- Dynamic questions -->
              <template v-for="q in meetingType.preguntas" :key="q.label">
                <Field :label="q.label + (q.required ? ' *' : '')" :required="q.required">
                  <Input
                    v-if="q.type === 'textarea'"
                    v-model="bookingForm.respuestas[q.label]"
                    multiline
                    :rows="3"
                    class="w-full"
                    :required="q.required"
                  />
                  <Input
                    v-else
                    v-model="bookingForm.respuestas[q.label]"
                    :type="q.type"
                    class="w-full"
                    :required="q.required"
                  />
                </Field>
              </template>

              <div class="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <Btn
                  type="button"
                  variant="outline"
                  class="flex-1"
                  @click="selectedSlot = null"
                >Cambiar horario</Btn>
                <Btn
                  type="submit"
                  class="flex-1"
                  :loading="booking"
                >{{ booking ? "Reservando..." : "Confirmar Reserva" }}</Btn>
              </div>
            </form>
          </div>
        </div>

        <!-- Success Modal -->
        <Modal
          :open="showSuccess"
          max-width="md"
          @close="closeSuccess"
        >
          <template #title>
            <div class="flex items-center justify-center flex-col">
              <div class="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Icon name="check-circle" class="h-8 w-8 text-green-600" />
              </div>
              <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">¡Reserva Confirmada!</h2>
            </div>
          </template>
          <div class="text-center space-y-3">
            <p class="text-zinc-600 dark:text-zinc-400">
              Tu reunión <strong>{{ meetingType.nombre }}</strong> ha sido agendada.
            </p>
            <div class="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-left">
              <p class="font-medium">{{ formatDateTime(bookingConfirmation.inicio) }}</p>
              <p class="text-sm text-zinc-500">Duración: {{ meetingType.duracionMin }} minutos</p>
              <p v-if="bookingConfirmation.invitadoTelefono" class="text-sm text-zinc-500">Tel: {{ bookingConfirmation.invitadoTelefono }}</p>
            </div>
            <p class="text-sm text-zinc-500">
              Se ha enviado un email de confirmación a {{ bookingForm.email }}
            </p>
            <Btn class="w-full" @click="closeSuccess" variant="primary">Entendido</Btn>
          </div>
        </Modal>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Btn from "../components/Btn.vue";
import Icon from "../components/Icon.vue";
import Field from "../components/Field.vue";
import Input from "../components/Input.vue";
import Modal from "../components/Modal.vue";
import { toast } from "../utils/toast";

const route = useRoute();
const router = useRouter();

const slug = computed(() => route.params.slug);

const meetingType = ref(null);
const loading = ref(true);
const error = ref(null);
const slots = ref([]);
const selectedDate = ref("");
const selectedSlot = ref(null);
const booking = ref(false);
const showSuccess = ref(false);
const bookingConfirmation = ref(null);

const bookingForm = ref({
  nombre: "",
  email: "",
  telefono: "",
  respuestas: {},
});

const minDate = computed(() => {
  if (!meetingType.value) return "";
  const min = new Date();
  min.setDate(min.getDate() + (meetingType.value.diasAntelacionMin || 1));
  return min.toISOString().split("T")[0];
});

const maxDate = computed(() => {
  if (!meetingType.value) return "";
  const max = new Date();
  max.setDate(max.getDate() + (meetingType.value.diasAntelacionMax || 60));
  return max.toISOString().split("T")[0];
});

const minDateDisplay = computed(() => {
  if (!meetingType.value) return "";
  const min = new Date();
  min.setDate(min.getDate() + (meetingType.value.diasAntelacionMin || 1));
  return min.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
});

const maxDateDisplay = computed(() => {
  if (!meetingType.value) return "";
  const max = new Date();
  max.setDate(max.getDate() + (meetingType.value.diasAntelacionMax || 60));
  return max.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
});

const groupedSlots = computed(() => {
  const groups = {};
  slots.value.forEach((slot) => {
    const date = new Date(slot.inicio).toISOString().split("T")[0];
    if (!groups[date]) groups[date] = { date, slots: [] };
    groups[date].slots.push(slot);
  });
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
});

const loadMeetingType = async () => {
  try {
    const { data } = await axios.get(`/api/reuniones/publico/${slug.value}`);
    meetingType.value = data;
    // Set default date to minDate
    selectedDate.value = minDate.value;
    await loadSlotsForDate();
  } catch (e) {
    console.error(e);
    error.value = "No se encontró el tipo de reunión o no está disponible";
  } finally {
    loading.value = false;
  }
};

const loadSlotsForDate = async () => {
  if (!selectedDate.value || !meetingType.value) return;
  try {
    const from = new Date(selectedDate.value);
    const to = new Date(from);
    to.setDate(to.getDate() + 7); // Load a week
    const { data } = await axios.get(`/api/reuniones/publico/${slug.value}/slots`, {
      params: { from: from.toISOString(), to: to.toISOString() },
    });
    slots.value = data.data || data;
    selectedSlot.value = null;
  } catch (e) {
    console.error(e);
    slots.value = [];
  }
};

const prevWeek = () => {
  if (!selectedDate.value) return;
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() - 7);
  if (d.toISOString().split("T")[0] >= minDate.value) {
    selectedDate.value = d.toISOString().split("T")[0];
  }
};

const nextWeek = () => {
  if (!selectedDate.value) return;
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + 7);
  if (d.toISOString().split("T")[0] <= maxDate.value) {
    selectedDate.value = d.toISOString().split("T")[0];
  }
};

const selectSlot = (slot) => {
  selectedSlot.value = slot;
};

const submitBooking = async () => {
  if (!selectedSlot.value) return;
  booking.value = true;
  try {
    const { data } = await axios.post(`/api/reuniones/publico/${slug.value}/reservar`, {
      slotId: selectedSlot.value.id,
      ...bookingForm.value,
    });
    bookingConfirmation.value = data;
    showSuccess.value = true;
    bookingForm.value = { nombre: "", email: "", telefono: "", respuestas: {} };
    selectedSlot.value = null;
  } catch (e) {
    console.error(e);
    toast.error("Error al reservar: " + (e.response?.data?.error || e.message));
  } finally {
    booking.value = false;
  }
};

const closeSuccess = () => {
  showSuccess.value = false;
  bookingConfirmation.value = null;
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDay = (dateString) => {
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const goBack = () => {
  router.push("/");
};

onMounted(() => {
  loadMeetingType();
});

watch(slug, () => {
  loading.value = true;
  error.value = null;
  meetingType.value = null;
  slots.value = [];
  selectedSlot.value = null;
  loadMeetingType();
});
</script>

<style scoped>
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>