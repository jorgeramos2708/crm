<!-- Pagination (Fase 4): pie de tabla con info de rango + Anterior/Siguiente.
  Slot `controls` para extras (ex: orden). Emite prev/next. -->
<template>
  <div
    class="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700"
  >
    <div class="text-sm text-zinc-500 dark:text-zinc-400">
      Mostrando {{ from }} a {{ to }} de {{ total }} {{ itemLabel }}
    </div>
    <div class="flex items-center gap-2">
      <slot name="controls" />
      <Btn
        variant="outline"
        :disabled="page === 1"
        class="text-zinc-600 disabled:cursor-not-allowed dark:text-zinc-400"
        @click="emit('prev')"
        >Anterior</Btn
      >
      <Btn
        variant="outline"
        :disabled="page === totalPages"
        class="text-zinc-600 disabled:cursor-not-allowed dark:text-zinc-400"
        @click="emit('next')"
        >Siguiente</Btn
      >
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Btn from "./Btn.vue";

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  itemLabel: { type: String, default: "elementos" },
});

const emit = defineEmits(["prev", "next"]);

const from = computed(() => (props.page - 1) * props.pageSize + 1);
const to = computed(() => Math.min(props.page * props.pageSize, props.total));
</script>
