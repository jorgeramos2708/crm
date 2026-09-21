<!-- Select (Fase 3): desplegable del sistema. Opciones por slot.
  Tamaños sm/md alineados con Btn. -->
<template>
  <select
    v-model="model"
    :required="required"
    :disabled="disabled"
    class="rounded-lg border border-zinc-300 bg-white disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700"
    :class="size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'"
  >
    <slot />
  </select>
</template>

<script setup>
defineProps({
  size: { type: String, default: "md" },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const model = defineModel();
</script>
