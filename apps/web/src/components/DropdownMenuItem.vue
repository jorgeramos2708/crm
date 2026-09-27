<!-- DropdownMenuItem: item del menú con tipografía/estados del DS.
  `danger` pinta rojo; `disabled` bloquea. Emite `select` (evento de Reka). -->
<template>
  <RekaDropdownMenuItem
    :disabled="disabled"
    :text-value="textValue"
    class="flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    :class="
      danger
        ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20'
        : 'text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700'
    "
    @select="emit('select', $event)"
  >
    <slot />
  </RekaDropdownMenuItem>
</template>

<script setup>
import { DropdownMenuItem as RekaDropdownMenuItem } from "reka-ui";

defineProps({
  danger: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  textValue: { type: String, default: undefined },
});

const emit = defineEmits(["select"]);
</script>
