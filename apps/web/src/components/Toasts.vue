<script setup>
import { useToast } from "../composables/useToast";
import ToastItem from "./Toast.vue";

const { toasts } = useToast();

function handleDismiss(id) {
  const { dismiss } = useToast();
  dismiss(id);
}

function handleUndo(id) {
  const { dismiss } = useToast();
  dismiss(id);
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      <ToastItem
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @dismiss="handleDismiss"
        @undo="handleUndo"
      />
    </div>
  </Teleport>
</template>