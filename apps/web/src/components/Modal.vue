<!-- Modal (Fase 3): diálogo reutilizable. Generaliza ConfirmDialog y los modales ad-hoc.
  `open` controla visibilidad, título por prop o slot #title, botones por slot #actions.
  Cierra con @close al pulsar fuera (click.self). -->
<template>
  <div
    v-if="open"
    class="fixed inset-0 flex items-center justify-center bg-black/50 px-4"
    :class="z"
    @click.self="emit('close')"
  >
    <div
      class="w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800"
      :class="maxWidth"
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
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  maxWidth: { type: String, default: "max-w-md" },
  z: { type: String, default: "z-50" },
});

const emit = defineEmits(["close"]);
</script>
