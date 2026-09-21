<!-- TableState (Fase 12): filas de estado para Table (cargando/vacío).
  Estandariza el patrón Skeleton + mensaje centrado con colspan. -->
<template>
  <tr v-if="loading">
    <td :colspan="colspan">
      <div class="p-4"><Skeleton :filas="filas" /></div>
    </td>
  </tr>
  <tr v-else>
    <td
      :colspan="colspan"
      class="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
    >
      <slot />
    </td>
  </tr>
</template>

<script setup>
import Skeleton from "./Skeleton.vue";

defineProps({
  loading: { type: Boolean, default: false },
  colspan: { type: [Number, String], required: true },
  filas: { type: Number, default: 5 },
});
</script>
