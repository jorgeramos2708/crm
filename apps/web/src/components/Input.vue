<!-- Input (Fase 3): campo de texto del sistema (input + textarea).
  Clases idénticas al patrón existente. El ancho lo pone el llamador (w-full, flex-1).
  v-model compatible (defineModel), listeners nativos (@keyup.enter...) se heredan. -->
<template>
  <textarea
    v-if="multiline"
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700"
  />
  <input
    v-else
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    class="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700"
  />
</template>

<script setup>
defineProps({
  type: { type: String, default: "text" },
  multiline: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 5 },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const model = defineModel();
</script>
