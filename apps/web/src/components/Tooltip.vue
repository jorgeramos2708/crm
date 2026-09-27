<!-- Tooltip: envoltorio de Reka UI Tooltip con el look flat del DS.
  Uso: <Tooltip content="Cerrar sesión"><Btn variant="ghost">…</Btn></Tooltip>
  Requiere TooltipProvider en la raíz (App.vue). -->
<template>
  <TooltipRoot :delay-duration="delay">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        :side="side"
        :side-offset="sideOffset"
        class="z-[90] rounded-lg border border-zinc-200 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-50 shadow-md dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        :class="`tooltip-${side}`"
      >
        <slot name="content">{{ content }}</slot>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<script setup>
import {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipPortal,
} from "reka-ui";

defineProps({
  content: { type: String, default: "" },
  side: { type: String, default: "bottom" },
  sideOffset: { type: Number, default: 6 },
  delay: { type: Number, default: 400 },
});
</script>

<style scoped>
.tooltip-top,
.tooltip-bottom {
  animation: tip-in 0.12s ease;
}
@keyframes tip-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .tooltip-top,
  .tooltip-bottom {
    animation: none;
  }
}
</style>
