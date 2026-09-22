<!-- Select: desplegable del sistema con transiciones. Opciones por slot.
  Tamaños sm/md alineados con Btn. -->
<template>
  <div class="relative inline-block">
    <select
      v-model="model"
      :required="required"
      :disabled="disabled"
      class="select-field"
      :class="{
        'focus-ring': focused,
        'error-ring': error,
        'sm:px-2 sm:py-1 sm:text-xs': size === 'sm',
        'px-3 py-2 text-sm': size !== 'sm',
      }"
      :style="hexStyle"
      @focus="focused = true"
      @blur="focused = false"
    >
      <slot />
    </select>
    <div v-if="focused" class="select-arrow animate-drop-in" aria-hidden="true">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const model = defineModel();
const focused = ref(false);

const props = defineProps({
  size: { type: String, default: "md" },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  hex: { type: String, default: "" },
});

const hexStyle = computed(() => {
  if (!props.hex) return undefined;
  return {
    borderColor: props.hex,
    backgroundColor: `color-mix(in srgb, ${props.hex} 18%, transparent)`,
    color: props.hex,
  };
});
</script>

<style scoped>
.select-wrapper {
  @apply inline-block relative;
}
.select-field {
  @apply rounded-lg border border-zinc-300 bg-white
         disabled:opacity-50
         dark:border-zinc-600 dark:bg-zinc-700
         appearance-none pr-10
         transition-all duration-200 ease-out;
}
.select-field:focus {
  @apply outline-none;
}
.select-field:not(:disabled):focus {
  border-color: var(--marca, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--marca, #2563eb) 20%, transparent);
}
.error-ring:not(:disabled) {
  @apply border-red-500 ring-2 ring-red-500/20;
}
.select-arrow {
  @apply absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none;
}
.animate-drop-in {
  animation: dropIn 0.2s ease-out;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-4px) rotate(-90deg); }
  to { opacity: 1; transform: translateY(0) rotate(0); }
}
@media (prefers-reduced-motion: reduce) {
  .animate-drop-in {
    animation: none !important;
  }
  .select-field {
    transition: none !important;
  }
}
</style>
