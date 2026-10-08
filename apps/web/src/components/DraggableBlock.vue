<template>
  <div
    class="draggable-block p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-grab hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
    :class="{ 'opacity-50': selected }"
    draggable="true"
    @dragstart="onDragStart"
    @click="$emit('click', block.id)"
  >
    <div class="flex items-center gap-2">
      <component :is="blockType.icon" class="h-5 w-5 text-zinc-500" />
      <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {{ blockType.name }}
      </span>
      <span v-if="selected" class="ml-auto text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
        Seleccionado
      </span>
    </div>
    <div class="mt-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">
      {{ previewContent }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { BLOCK_TYPES } from '@/utils/mjml/generateMJML.mjs';

defineProps<{
  block: {
    id: string;
    type: string;
    content: Record<string, any>;
  };
  selected?: boolean;
}>();

defineEmits<{
  click: [id: string];
  'drag-start': [id: string];
}>();

const blockType = computed(() => BLOCK_TYPES[props.block.type] || { name: 'Desconocido', icon: 'help-circle' });

const previewContent = computed(() => {
  const content = props.block.content;
  switch (props.block.type) {
    case 'text':
      return content.text?.slice(0, 50) + (content.text?.length > 50 ? '...' : '');
    case 'image':
      return content.src ? `Imagen: ${content.src.slice(0, 30)}...` : 'Imagen sin fuente';
    case 'button':
      return `Botón: "${content.text}" → ${content.href}`;
    case 'divider':
      return `Divisor: ${content.color}, ${content.height}px`;
    case 'spacer':
      return `Espaciador: ${content.height}px`;
    default:
      return '';
  }
});

function onDragStart(e: DragEvent) {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData('text/plain', props.block.id);
  e.dataTransfer.effectAllowed = 'move';
}
</script>

<style scoped>
.draggable-block {
  user-select: none;
}
.draggable-block:active {
  cursor: grabbing;
}
</style>