<!-- Field (Fase 3): etiqueta + control + ayuda/error.
  Estandariza el patrón label block + input (ex: modal de Contactos). -->
<template>
  <div>
    <label v-if="label" class="mb-1 block text-sm">
      {{ label }}<span v-if="required"> *</span>
    </label>
    <slot />
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
