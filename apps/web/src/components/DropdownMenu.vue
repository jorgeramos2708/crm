<!-- DropdownMenu: envoltorio de Reka UI DropdownMenu con items del DS.
  Uso:
    <DropdownMenu>
      <template #trigger><Btn variant="ghost">Menú</Btn></template>
      <DropdownMenuItem @select="…">Acción</DropdownMenuItem>
      <DropdownMenuItem danger @select="…">Eliminar</DropdownMenuItem>
    </DropdownMenu> -->
<template>
  <DropdownMenuRoot v-model:open="abierto" :modal="modal">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        class="z-[90] min-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
        :class="`ddm-${side}`"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup>
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
} from "reka-ui";

const abierto = defineModel({ type: Boolean, default: false });

defineProps({
  side: { type: String, default: "bottom" },
  align: { type: String, default: "end" },
  sideOffset: { type: Number, default: 6 },
  modal: { type: Boolean, default: true },
});
</script>

<style scoped>
.ddm-bottom,
.ddm-top {
  animation: ddm-in 0.14s ease;
}
@keyframes ddm-in {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ddm-bottom,
  .ddm-top {
    animation: none;
  }
}
</style>
