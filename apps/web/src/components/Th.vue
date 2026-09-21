<!-- Th (Fase 3): celda de cabecera de Table. -->
<template>
  <th
    class="px-6 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
    :class="
      align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left'
    "
  >
    <slot />
  </th>
</template>

<script setup>
defineProps({
  align: { type: String, default: "left" },
});
</script>
