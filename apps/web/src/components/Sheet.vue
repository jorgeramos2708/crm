<!-- Sheet: panel lateral con Reka UI Dialog (mismo contrato que Modal:
  open, @close, slots). `side`: left | right. `width` acepta clases Tailwind. -->
<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogContent as-child :disable-outside-pointer-events="false">
      <div
        class="fixed inset-0 z-50 sheet-shell"
        :class="`sheet-${side}`"
        @click.self="emit('close')"
      >
        <div
          class="absolute inset-0 bg-black/50 sheet-overlay"
          aria-hidden="true"
        />
        <div
          class="absolute inset-y-0 flex flex-col bg-white shadow-xl dark:bg-zinc-800 sheet-panel"
          :class="[
            side === 'right'
              ? 'right-0 border-l border-zinc-200 dark:border-zinc-700'
              : 'left-0 border-r border-zinc-200 dark:border-zinc-700',
            width,
          ]"
        >
          <DialogTitle as-child>
            <div
              v-if="$slots.header || title"
              class="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700"
            >
              <slot name="header">
                <h2 class="text-base font-semibold">{{ title }}</h2>
              </slot>
              <button
                type="button"
                class="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                aria-label="Cerrar panel"
                @click="emit('close')"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </DialogTitle>
          <DialogDescription as-child>
            <p class="sr-only">{{ description }}</p>
          </DialogDescription>
          <div class="flex-1 overflow-y-auto">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="border-t border-zinc-200 p-4 dark:border-zinc-700"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </DialogContent>
  </DialogRoot>
</template>

<script setup>
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  description: { type: String, default: "Panel lateral" },
  side: { type: String, default: "right" },
  width: { type: String, default: "w-[320px] max-w-[90vw]" },
});

const emit = defineEmits(["close"]);

function onOpenChange(v) {
  if (!v) emit("close");
}
</script>

<style scoped>
.sheet-shell[data-state="open"] .sheet-overlay {
  animation: sheet-fade 0.2s ease;
}
.sheet-shell[data-state="closed"] .sheet-overlay {
  animation: sheet-fade-out 0.18s ease;
}
.sheet-shell.sheet-right[data-state="open"] .sheet-panel {
  animation: sheet-in-right 0.22s ease;
}
.sheet-shell.sheet-right[data-state="closed"] .sheet-panel {
  animation: sheet-out-right 0.18s ease;
}
.sheet-shell.sheet-left[data-state="open"] .sheet-panel {
  animation: sheet-in-left 0.22s ease;
}
.sheet-shell.sheet-left[data-state="closed"] .sheet-panel {
  animation: sheet-out-left 0.18s ease;
}
@keyframes sheet-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes sheet-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes sheet-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes sheet-in-left {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
@keyframes sheet-out-right {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes sheet-out-left {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sheet-shell[data-state] .sheet-overlay,
  .sheet-shell[data-state] .sheet-panel {
    animation: none !important;
  }
}
</style>
