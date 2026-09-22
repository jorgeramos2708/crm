<!-- Input: campo de texto del sistema (input + textarea) con transiciones de focus.
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
    class="input-field"
    :class="{ 'focus-ring': focused, 'error-ring': error }"
    @focus="focused = true"
    @blur="focused = false"
  />
  <input
    v-else
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    class="input-field"
    :class="{ 'focus-ring': focused, 'error-ring': error }"
    @focus="focused = true"
    @blur="focused = false"
  />
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  type: { type: String, default: "text" },
  multiline: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 5 },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
});

const model = defineModel();
const focused = ref(false);
</script>

<style scoped>
.input-field {
  @apply rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm
         disabled:opacity-50
         dark:border-zinc-600 dark:bg-zinc-700
         transition-colors duration-200 ease-out;
}
.input-field:focus {
  @apply outline-none;
}
.focus-ring:not(:disabled) {
  border-color: var(--marca, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--marca, #2563eb) 20%, transparent);
}
.error-ring:not(:disabled) {
  @apply border-red-500 ring-2 ring-red-500/20 dark:ring-red-500/30;
}
.error-ring:not(:disabled):focus {
  @apply ring-red-500/30;
}
@media (prefers-reduced-motion: reduce) {
  .input-field {
    transition: none !important;
  }
}
</style>
