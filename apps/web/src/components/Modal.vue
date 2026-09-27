<!-- Modal: diálogo reutilizable con Reka UI Dialog (foco atrapado, Escape,
  scroll-lock y aria: DialogTitle + DialogDescription) manteniendo el look flat.
  `open` controla visibilidad, título por prop o slot #title, botones por slot #actions.
  Cierra con @close al pulsar fuera o con Escape. -->
<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogContent as-child :disable-outside-pointer-events="false">
      <div
        class="fixed inset-0 flex items-center justify-center bg-black/50 px-4 dialog-shell"
        :class="z"
        @click.self="emit('close')"
      >
        <div
          class="w-full rounded-2xl bg-white p-6 shadow-xl dialog-panel dark:bg-zinc-800"
          :class="[maxWidth, contentClass]"
        >
          <DialogTitle v-if="$slots.title" as-child>
            <slot name="title" />
          </DialogTitle>
          <DialogTitle v-else-if="title" class="text-lg font-semibold">
            {{ title }}
          </DialogTitle>
          <DialogDescription as-child>
            <p class="sr-only">
              <slot name="description">{{ description }}</slot>
            </p>
          </DialogDescription>
          <slot />
          <div v-if="$slots.actions" class="mt-5 flex gap-2">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </DialogContent>
  </DialogRoot>
</template>

<script setup>
import { watch } from "vue";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  description: { type: String, default: "Diálogo" },
  maxWidth: { type: String, default: "max-w-md" },
  contentClass: { type: String, default: "" },
  z: { type: String, default: "z-50" },
});

const emit = defineEmits(["close"]);

function onOpenChange(v) {
  if (!v) emit("close");
}

let safetyTimer;
watch(
  () => props.open,
  (abierto) => {
    if (safetyTimer) clearTimeout(safetyTimer);
    if (abierto) return;
    safetyTimer = setTimeout(() => {
      if (document.querySelector(".dialog-shell")) return;
      if (document.body.style.pointerEvents === "none")
        document.body.style.pointerEvents = "";
      if (document.body.style.overflow === "hidden")
        document.body.style.overflow = "";
    }, 300);
  },
);
</script>

<style scoped>
.dialog-shell[data-state="open"] {
  animation: dialog-fade 0.2s ease;
}
.dialog-shell[data-state="closed"] {
  animation: dialog-fade-out 0.2s ease;
}
.dialog-panel {
  animation: dialog-scale 0.2s ease;
}
.dialog-shell[data-state="closed"] .dialog-panel {
  animation: dialog-scale-out 0.2s ease;
}
@keyframes dialog-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes dialog-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes dialog-scale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes dialog-scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dialog-shell[data-state="open"],
  .dialog-shell[data-state="closed"],
  .dialog-panel,
  .dialog-shell[data-state="closed"] .dialog-panel {
    animation: none !important;
  }
}
</style>
