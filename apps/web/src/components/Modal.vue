<!-- Modal: diálogo reutilizable con animación fade+scale.
  `open` controla visibilidad, título por prop o slot #title, botones por slot #actions.
  Cierra con @close al pulsar fuera (click.self). -->
<template>
  <Transition name="modal" appear>
    <div
      v-if="open"
      class="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
      :class="z"
      @click.self="emit('close')"
    >
      <div
        class="w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800"
        :class="[maxWidth, contentClass]"
      >
        <slot name="title">
          <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
        </slot>
        <slot />
        <div v-if="$slots.actions" class="mt-5 flex gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  maxWidth: { type: String, default: "max-w-md" },
  contentClass: { type: String, default: "" },
  z: { type: String, default: "z-50" },
});

const emit = defineEmits(["close"]);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
.modal-enter-to .modal-content,
.modal-leave-from .modal-content {
  transform: scale(1);
}
</style>
