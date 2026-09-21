<template>
  <div
    class="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2"
  >
    <div
      v-for="t in estadoToasts.items.value"
      :key="t.id"
      class="pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg dark:bg-zinc-800"
      :class="borde[t.tipo]"
    >
      <Badge
        :color="colorPorTipo[t.tipo]"
        dot-size="h-2.5 w-2.5"
        class="mt-0.5 flex-shrink-0"
      />
      <span class="text-zinc-700 dark:text-zinc-200">{{ t.texto }}</span>
    </div>
  </div>
</template>

<script setup>
import { estadoToasts } from "../utils/toast";
import Badge from "./Badge.vue";

const borde = {
  exito: "border-green-200 dark:border-green-800",
  error: "border-red-200 dark:border-red-800",
  info: "border-zinc-200 dark:border-zinc-700",
};
const colorPorTipo = {
  exito: "green",
  error: "red",
  info: "zinc",
};
</script>
