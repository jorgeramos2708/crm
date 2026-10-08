<script setup>
import { computed } from "vue";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Undo,
  X,
} from "@lucide/vue";

const props = defineProps({
  toast: {
    type: Object,
    required: true,
  },
  onDismiss: Function,
  onUndo: Function,
});

const emit = defineEmits(["dismiss", "undo"]);

const typeStyles = computed(() => ({
  success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
}));

const typeIcons = computed(() => ({
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}));

const typeIconColors = computed(() => ({
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
}));

function handleUndo() {
  emit("undo", props.toast.id);
  emit("dismiss", props.toast.id);
}

function handleDismiss() {
  emit("dismiss", props.toast.id);
}
</script>

<template>
  <div
    :class="[
      'relative flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in',
      typeStyles[toast.type] || typeStyles.info,
    ]"
    role="alert"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Icon -->
    <component
      :is="typeIcons[toast.type] || typeIcons.info"
      :class="['w-5 h-5 flex-shrink-0 mt-0.5', typeIconColors[toast.type] || typeIconColors.info]"
      aria-hidden="true"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p v-if="toast.title" class="text-sm font-medium text-gray-900 dark:text-gray-100">
        {{ toast.title }}
      </p>
      <p v-if="toast.message" class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {{ toast.message }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <button
        v-if="toast.undo"
        @click="handleUndo"
        class="btn btn-sm btn-ghost text-sm flex items-center gap-1"
      >
        <Undo class="w-3.5 h-3.5" aria-hidden="true" />
        Deshacer
      </button>
      <button
        @click="handleDismiss"
        class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Cerrar"
      >
        <X class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script>
const typeIconColors = computed(() => ({
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
}));
</script>