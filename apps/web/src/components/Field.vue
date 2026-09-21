<!-- Field (Fase 3, rev. Fase 9): etiqueta + control + ayuda/error.
  La etiqueta ENVUELVE al control (asociación implícita para lectores de
  pantalla) con el mismo espaciado visual del patrón label block + input. -->
<template>
  <div>
    <label v-if="label" class="block text-sm">
      <span class="mb-1 block">{{ label }}<span v-if="required"> *</span></span>
      <slot />
    </label>
    <slot v-else />
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "" },
  required: { type: Boolean, default: false },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
});
</script>
