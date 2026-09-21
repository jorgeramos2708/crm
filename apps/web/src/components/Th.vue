<!-- Th (Fase 3): celda de cabecera de Table. -->
<template>
  <th
    class="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
    :class="[
      compact ? 'px-3 py-2' : 'px-6 py-3',
      align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left',
    ]"
  >
    <slot />
  </th>
</template>

<script setup>
defineProps({
  align: { type: String, default: "left" },
  compact: { type: Boolean, default: false },
});
</script>
