<!-- CommandPalette: paleta de comandos ⌘K/Ctrl+K (Reka Dialog + filtro).
  props: `open`, `commands` [{ id, label, hint?, icon?, group?, to?, run? }].
  Emite `close` al salir y `select` al elegir un comando. Navegación con
  ↑/↓, Enter ejecuta, Escape cierra. -->
<template>
  <DialogRoot :open="open" @update:open="onOpenChange">
    <DialogContent as-child :disable-outside-pointer-events="false">
      <div
        class="fixed inset-0 z-[95] flex items-start justify-center bg-black/50 px-4 pt-[12vh] cmd-shell"
        @click.self="emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Paleta de comandos"
          class="cmd-panel w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-800"
        >
          <DialogTitle as-child>
            <div
              class="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-700"
            >
              <svg
                class="h-4 w-4 flex-shrink-0 text-zinc-400"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
              <input
                ref="inputRef"
                v-model="query"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                :aria-activedescendant="
                  activo ? `cmd-item-${activo.id}` : undefined
                "
                placeholder="Buscar comandos o ir a…"
                class="h-12 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                @keydown="onKeydown"
              />
              <kbd
                class="hidden flex-shrink-0 rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 sm:block"
              >
                Esc
              </kbd>
            </div>
          </DialogTitle>
          <DialogDescription as-child>
            <p class="sr-only">Busca comandos o destinos del CRM</p>
          </DialogDescription>

          <ul
            id="cmd-list"
            role="listbox"
            aria-label="Resultados"
            class="max-h-[min(60vh,420px)] overflow-y-auto p-2"
          >
            <li
              v-for="(item, i) in filtrados"
              :key="item.id"
              :id="`cmd-item-${item.id}`"
              role="option"
              :aria-selected="i === indice"
              class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              :class="
                i === indice
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-700 dark:text-zinc-200'
              "
              @mouseenter="indice = i"
              @click="ejecutar(item)"
            >
              <Icon
                v-if="item.icon"
                :name="item.icon"
                class="h-4 w-4 flex-shrink-0 opacity-70"
              />
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="item.group"
                class="flex-shrink-0 text-xs opacity-60"
                >{{ item.group }}</span
              >
              <kbd
                v-if="item.hint"
                class="rounded border px-1.5 py-0.5 text-[10px] font-medium opacity-70"
                :class="
                  i === indice
                    ? 'border-zinc-400/50'
                    : 'border-zinc-200 dark:border-zinc-600'
                "
                >{{ item.hint }}</kbd
              >
            </li>
            <li
              v-if="!filtrados.length"
              class="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
            >
              Sin resultados para “{{ query }}”
            </li>
          </ul>

          <div
            class="flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
          >
            <span>↑ ↓ navegar · ↵ abrir</span>
            <span>{{ filtrados.length }} resultado(s)</span>
          </div>
        </div>
      </div>
    </DialogContent>
  </DialogRoot>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import Icon from "./Icon.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  commands: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "select"]);

const query = ref("");
const indice = ref(0);
const inputRef = ref(null);

const filtrados = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.commands;
  return props.commands.filter((c) => {
    const hay = `${c.label} ${c.group || ""} ${c.hint || ""}`.toLowerCase();
    return hay.includes(q);
  });
});

const activo = computed(() => filtrados.value[indice.value] || null);

watch(
  () => props.open,
  async (v) => {
    if (v) {
      query.value = "";
      indice.value = 0;
      await nextTick();
      inputRef.value?.focus();
    }
  },
);

watch(filtrados, () => {
  if (indice.value >= filtrados.value.length) indice.value = 0;
});

function onOpenChange(v) {
  if (!v) emit("close");
}

function ejecutar(item) {
  if (!item) return;
  emit("select", item);
  emit("close");
}

function onKeydown(e) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (filtrados.value.length)
      indice.value = (indice.value + 1) % filtrados.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (filtrados.value.length)
      indice.value =
        (indice.value - 1 + filtrados.value.length) % filtrados.value.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    ejecutar(activo.value);
  }
}
</script>

<style scoped>
.cmd-shell[data-state="open"] .cmd-panel {
  animation: cmd-in 0.16s ease;
}
.cmd-shell[data-state="closed"] .cmd-panel {
  animation: cmd-out 0.12s ease;
}
@keyframes cmd-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes cmd-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cmd-shell[data-state] .cmd-panel {
    animation: none !important;
  }
}
</style>
