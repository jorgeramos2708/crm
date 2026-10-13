<!-- Modal (Premium): diálogo reutilizable con Reka UI Dialog
  Características premium:
  - Backdrop blur con glassmorphism
  - Animaciones de entrada/salida con spring physics
  - Scroll lock automático
  - Focus trap y gestión de foco
  - Escape para cerrar
  - Click outside para cerrar
  - Tamaños: sm, md, lg, xl, full
  - Slots: title, description, header, footer, default
  - Accesibilidad completa (ARIA, focus trap, scroll lock) -->
<template>
  <Teleport to="body">
    <DialogRoot :open="open" @update:open="onOpenChange">
      <!-- Backdrop with glassmorphism -->
      <DialogOverlay
        class="fixed inset-0 modal-backdrop"
        :class="{ 'data-[state=open]:animate-fade-in': true, 'data-[state=closed]:animate-fade-out': true }"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          :class="{ 'data-[state=open]:animate-fade-in': true, 'data-[state=closed]:animate-fade-out': true }"
        />
      </DialogOverlay>

      <!-- Modal Content -->
      <DialogContent
        as-child
        :disable-outside-pointer-events="false"
        class="modal-content-wrapper"
      >
        <div
          class="fixed inset-0 flex items-center justify-center p-4 modal-shell"
          :class="z"
          @click.self="emit('close')"
        >
          <div
            class="modal-content"
            :class="[
              maxWidthClass,
              maxWidth,
              contentClass,
              'modal-panel',
              { 'modal-sm': size === 'sm' },
              { 'modal-md': size === 'md' },
              { 'modal-lg': size === 'lg' },
              { 'modal-xl': size === 'xl' },
              { 'modal-full': size === 'full' },
            ]"
            role="dialog"
            aria-modal="true"
          >
            <!-- Reka exige Title/Description: invisibles si el llamador no los da.
              Los ids los genera Reka (ids fijos rompian su lookup + aria). -->
            <DialogTitle v-if="!(title || $slots.header || $slots.title)" class="sr-only">
              Diálogo
            </DialogTitle>
            <DialogDescription v-if="!description" class="sr-only">
              Cuadro de diálogo
            </DialogDescription>
            <!-- Header -->
            <header v-if="title || $slots.header || $slots.title" class="modal-header">
              <DialogTitle v-if="$slots.header" as-child>
                <slot name="header" />
              </DialogTitle>
              <DialogTitle v-else-if="$slots.title" as-child>
                <slot name="title" />
              </DialogTitle>
              <DialogTitle v-else-if="title" class="modal-title">
                {{ title }}
              </DialogTitle>
              <DialogDescription v-if="description" class="sr-only">
                {{ description }}
              </DialogDescription>

              <button
                v-if="closable"
                type="button"
                class="modal-close"
                @click="emit('close')"
                aria-label="Cerrar"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </header>

            <!-- Body -->
            <div class="modal-body" :class="contentClass">
              <slot />
            </div>

            <!-- Footer -->
            <footer v-if="$slots.footer || showDefaultFooter" class="modal-footer">
              <slot name="footer">
                <div v-if="showDefaultFooter" class="flex w-full justify-end gap-2">
                  <Btn
                    variant="ghost"
                    size="sm"
                    @click="emit('close')"
                  >
                    Cancelar
                  </Btn>
                  <Btn
                    variant="primary"
                    size="sm"
                    :loading="submitLoading"
                    @click="handleConfirm"
                  >
                    {{ confirmText }}
                  </Btn>
                </div>
              </slot>
            </footer>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, ref, computed, nextTick } from "vue";
import {
  DialogRoot,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import Btn from "./Btn.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["sm", "md", "lg", "xl", "full"].includes(v),
  },
  contentClass: { type: String, default: "" },
  // Ancho extra tal cual (ej. max-width="max-w-md"); vacío = size.
  maxWidth: { type: String, default: "" },
  z: { type: String, default: "z-50" },
  closable: { type: Boolean, default: true },
  showDefaultFooter: { type: Boolean, default: false },
  confirmText: { type: String, default: "Confirmar" },
  submitLoading: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "confirm", "update:open"]);

const focusedElementBeforeOpen = ref(null);

const maxWidthClass = computed(() => {
  switch (props.size) {
    case "sm": return "max-w-sm";
    case "md": return "max-w-md";
    case "lg": return "max-w-lg";
    case "xl": return "max-w-xl";
    case "full": return "max-w-4xl";
    default: return "max-w-md";
  }
});

function onOpenChange(v) {
  if (!v) {
    emit("update:open", false);
    emit("close");
  }
}

let safetyTimer;
watch(
  () => props.open,
  (abierto) => {
    if (safetyTimer) clearTimeout(safetyTimer);
    if (abierto) {
      focusedElementBeforeOpen.value = document.activeElement;
      document.body.style.overflow = "hidden";
      // Reka puede dejar body con pointer-events:none sin restaurarlo en el
      // contenido personalizado (as-child): sin esto ningún botón responde.
      // Se limpia tras el render para correr después de Reka.
      nextTick(() => {
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
        const modal = document.querySelector(".modal-panel");
        if (modal) {
          const focusable = modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusable?.focus();
        }
      });
      return;
    }
    safetyTimer = setTimeout(() => {
      if (document.querySelector(".modal-shell")) return;
      if (document.body.style.pointerEvents === "none")
        document.body.style.pointerEvents = "";
      if (document.body.style.overflow === "hidden")
        document.body.style.overflow = "";
      // Restore focus
      if (focusedElementBeforeOpen.value) {
        (focusedElementBeforeOpen.value as HTMLElement).focus();
      }
    }, 300);
  },
);

function handleConfirm() {
  emit("confirm");
}
</script>

<style scoped>
.modal-backdrop {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm;
  animation: fade-in var(--duration-fast) var(--ease-out);
  pointer-events: auto;
}

/* Cinturón y tirantes: el contenido siempre recibe clics aunque el
   body quede con pointer-events:none (ver watcher) */
.modal-shell,
.modal-panel {
  pointer-events: auto;
}

.modal-shell {
  @apply fixed inset-0 flex items-center justify-center p-4;
  z-index: var(--z-modal);
}

.modal-panel {
  @apply w-full rounded-2xl bg-[var(--card)] shadow-2xl;
  border: 1px solid var(--card-border);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: scale-in var(--duration-normal) var(--ease-spring);
  /* El panel debe pintar sobre el backdrop (fixed): sin position el
     backdrop intercepta todos los clics y los botones quedan muertos */
  position: relative;
  z-index: 1;
}

/* Size variants */
.modal-sm { max-width: 380px; }
.modal-md { max-width: 480px; }
.modal-lg { max-width: 640px; }
.modal-xl { max-width: 800px; }
.modal-full { max-width: 95vw; width: 95vw; }

/* Header */
.modal-header {
  @apply flex items-center justify-between px-6 py-4 border-b;
  border-color: var(--card-border);
  flex-shrink: 0;
}

.modal-title {
  @apply text-lg font-semibold text-[var(--fg)];
}

.modal-close {
  @apply flex items-center justify-center w-10 h-10 rounded-xl
       text-[var(--fg-muted)] hover:text-[var(--fg)]
       hover:bg-[var(--bg-subtle)] transition-colors duration-100 ease-out
       focus-ring focus-ring-offset-2;
}

.modal-close:hover {
  background-color: var(--bg-subtle);
}

/* Body */
.modal-body {
  @apply p-6 overflow-y-auto flex-1;
  min-height: 0;
}

/* Footer */
.modal-footer {
  @apply flex items-center justify-end gap-2 px-6 py-4 border-t;
  border-color: var(--card-border);
  flex-shrink: 0;
  padding-top: 1.5rem;
  margin-top: auto;
}

/* Animations */
.modal-backdrop[data-state="open"] {
  animation: fade-in var(--duration-fast) var(--ease-out);
}
.modal-backdrop[data-state="closed"] {
  animation: fade-out var(--duration-fast) var(--ease-in);
}

.modal-panel {
  animation: scale-in var(--duration-normal) var(--ease-spring);
}

@media (prefers-reduced-motion: reduce) {
  .modal-backdrop,
  .modal-panel {
    animation: none !important;
  }
}

/* Scroll lock */
html.modal-open,
body.modal-open {
  overflow: hidden;
}

/* Focus trap visual */
.modal-panel:focus-within {
  box-shadow: 0 0 0 2px var(--brand), var(--shadow-xl);
}
</style>