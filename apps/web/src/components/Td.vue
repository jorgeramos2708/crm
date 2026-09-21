<!-- Td (Fase 3): celda de Table. `primary` para la columna principal.
  Atributos extra (colspan...) se heredan a la celda. -->
<template>
  <td
    class="whitespace-nowrap text-sm"
    :class="[
      compact ? 'px-3 py-2' : 'px-6 py-4',
      primary ? 'font-medium' : '',
      primary || tone === 'strong'
        ? 'text-zinc-900 dark:text-zinc-100'
        : 'text-zinc-500 dark:text-zinc-400',
      align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left',
    ]"
  >
    <slot />
  </td>
</template>

<script setup>
defineProps({
  primary: { type: Boolean, default: false },
  tone: { type: String, default: "muted" },
  align: { type: String, default: "left" },
  compact: { type: Boolean, default: false },
});
</script>
