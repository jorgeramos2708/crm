<template>
  <div class="w-full h-full flex flex-col">
    <!-- Toolbar -->
    <div class="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 p-3 flex flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <Btn @click="addBlock('text')" variant="outline" size="sm" icon="plus">
          Texto
        </Btn>
        <Btn @click="addBlock('image')" variant="outline" size="sm" icon="image">
          Imagen
        </Btn>
        <Btn @click="addBlock('button')" variant="outline" size="sm" icon="mouse-pointer">
          Botón
        </Btn>
        <Btn @click="addBlock('divider')" variant="outline" size="sm" icon="minus">
          Divisor
        </Btn>
        <Btn @click="addBlock('spacer')" variant="outline" size="sm" icon="layout">
          Espaciador
        </Btn>
      </div>
      <div class="flex-1" />
      <div class="flex items-center gap-2">
        <Btn @click="undo" variant="ghost" size="sm" icon="rotate-ccw" :disabled="!canUndo" title="Deshacer" />
        <Btn @click="redo" variant="ghost" size="sm" icon="rotate-cw" :disabled="!canRedo" title="Rehacer" />
        <div class="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
        <Btn @click="togglePreview" variant="outline" size="sm" :variant="previewMode ? 'primary' : 'outline'">
          <Icon :name="previewMode ? 'eye-off' : 'eye'" class="h-4 w-4 mr-1" />
          {{ previewMode ? 'Código' : 'Vista previa' }}
        </Btn>
        <Btn @click="exportMJML" variant="outline" size="sm" icon="download">
          Exportar MJML
        </Btn>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Blocks palette -->
      <aside class="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 overflow-y-auto p-3">
        <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Bloques</h3>
        <div class="space-y-2">
          <DraggableBlock
            v-for="block in blocks"
            :key="block.id"
            :block="block"
            :selected="selectedBlockId === block.id"
            @click="selectBlock(block.id)"
            @dragstart="handleDragStart"
          />
        </div>
      </aside>

      <!-- Canvas area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="bg-zinc-100 dark:bg-zinc-900 p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
          <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {{ previewMode ? 'Vista previa' : 'Editor' }}
          </h2>
          <div class="flex items-center gap-2">
            <select v-model="devicePreview" class="text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-800">
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
              <option value="mobile">Móvil</option>
            </select>
          </div>
        </div>

        <!-- Canvas / Preview -->
        <div
          class="flex-1 overflow-auto p-8 flex items-center justify-center"
          :class="{ 'bg-white': !previewMode, 'bg-zinc-100': previewMode }"
          @dragover.prevent
          @drop="handleDrop"
        >
          <div
            :class="[
              'max-w-[600px] w-full',
              devicePreview === 'mobile' && 'max-w-[375px]',
              devicePreview === 'tablet' && 'max-w-[768px]',
            ]"
          >
            <div v-if="!previewMode" class="bg-white rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <!-- Drop zones -->
              <div
                v-for="(block, index) in blocks"
                :key="block.id"
                class="relative"
              >
                <!-- Drop zone above -->
                <div
                  class="drop-zone h-2 mx-4 border-2 border-dashed border-transparent hover:border-blue-500 transition-colors"
                  :class="{ 'border-blue-500 bg-blue-50': dragOverIndex === index && dragOverPosition === 'before' }"
                  @dragover.prevent="handleDragOver(index, 'before')"
                  @dragleave="handleDragLeave"
                  @drop="handleDrop(index, 'before')"
                />

                <!-- Block -->
                <div
                  class="block-container p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedBlockId === block.id }"
                  draggable="true"
                  @dragstart="handleDragStart(block.id)"
                  @click="selectBlock(block.id)"
                >
                  <BlockRenderer :block="block" :selected="selectedBlockId === block.id" @update="updateBlock" @delete="removeBlock" />
                </div>

                <!-- Drop zone after last -->
                <div v-if="index === blocks.length - 1" class="drop-zone h-2 mx-4 border-2 border-dashed border-transparent hover:border-blue-500 transition-colors" @dragover.prevent="handleDragOver(index, 'after')" @dragleave="handleDragLeave" @drop="handleDrop(index, 'after')" />
              </div>

              <!-- Empty state -->
              <div v-if="blocks.length === 0" class="p-12 text-center text-zinc-500 dark:text-zinc-400">
                <Icon name="mail" class="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                <p class="text-lg font-medium text-zinc-700 dark:text-zinc-300">Arrastra bloques aquí para empezar</p>
                <p class="text-sm mt-1">O haz clic en un botón de la barra lateral</p>
              </div>
            </div>

            <!-- Preview mode -->
            <div v-else class="bg-white rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <iframe
                ref="previewFrame"
                class="w-full h-full border-0"
                :srcdoc="previewHtml"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <!-- Properties panel -->
      <aside v-if="selectedBlockId" class="w-80 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 overflow-y-auto p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Propiedades</h3>
          <Btn @click="selectBlock(null)" variant="ghost" size="sm" icon="x">Cerrar</Btn>
        </div>

        <BlockProperties :block="selectedBlock" @update="updateBlock" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import mjml2html from 'mjml-browser';
import DraggableBlock from './DraggableBlock.vue';
import BlockRenderer from './BlockRenderer.vue';
import BlockProperties from './BlockProperties.vue';
import Btn from '@/components/Btn.vue';
import Icon from '@/components/Icon.vue';

// MJML generation is loaded dynamically to avoid Vite's Vue compiler parsing MJML template literals as JSX
let generateMJML: (blocks: any[]) => string;
let BLOCK_TYPES: any;

async function loadMJMLModule() {
  const module = await import('@/utils/mjml/generateMJML.mjs');
  generateMJML = module.generateMJML;
  BLOCK_TYPES = module.BLOCK_TYPES;
}

interface EmailBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
}

const blocks = ref<EmailBlock[]>([]);
const selectedBlockId = ref<string | null>(null);
const previewMode = ref(false);
const devicePreview = ref<'desktop' | 'tablet' | 'mobile'>('desktop');
const dragOverIndex = ref<number | null>(null);
const dragOverPosition = ref<'before' | 'after' | null>(null);
const draggedBlockId = ref<string | null>(null);

// Undo/Redo
const history = ref<EmailBlock[][]>([]);
const historyIndex = ref(-1);

const selectedBlock = computed(() => blocks.value.find(b => b.id === selectedBlockId.value) || null);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

function pushHistory() {
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(JSON.parse(JSON.stringify(blocks.value)));
  historyIndex.value = history.value.length - 1;
  if (history.value.length > 50) {
    history.value.shift();
    historyIndex.value--;
  }
}

function undo() {
  if (!canUndo.value) return;
  historyIndex.value--;
  blocks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
  selectedBlockId.value = null;
}

function redo() {
  if (!canRedo.value) return;
  historyIndex.value++;
  blocks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]));
  selectedBlockId.value = null;
}

function addBlock(type: string) {
  const newBlock: EmailBlock = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: getDefaultContent(type),
    styles: getDefaultStyles(type),
  };
  blocks.value.push(newBlock);
  pushHistory();
  nextTick(() => selectBlock(newBlock.id));
}

function getDefaultContent(type: string): Record<string, any> {
  const defaults: Record<string, any> = {
    text: { html: '<p>Escribe tu texto aquí...</p>' },
    image: { src: '', alt: '', href: '' },
    button: { text: 'Botón', href: '', backgroundColor: '#3b82f6', color: '#ffffff' },
    divider: { color: '#e5e7eb', width: '1px', style: 'solid' },
    spacer: { height: '20px' },
  };
  return defaults[type] || {};
}

function getDefaultStyles(type: string): Record<string, any> {
  const defaults: Record<string, any> = {
    text: { padding: '16px', fontSize: '16px', lineHeight: '1.5', color: '#1f2937', fontFamily: 'inherit', textAlign: 'left' },
    image: { padding: '16px', borderRadius: '8px', align: 'center' },
    button: { padding: '16px', borderRadius: '8px', align: 'center' },
    divider: { padding: '16px' },
    spacer: { padding: '0' },
  };
  return defaults[type] || {};
}

function selectBlock(id: string | null) {
  selectedBlockId.value = id;
}

function updateBlock(id: string, updates: Partial<EmailBlock>) {
  const idx = blocks.value.findIndex(b => b.id === id);
  if (idx >= 0) {
    blocks.value[idx] = { ...blocks.value[idx], ...updates };
    pushHistory();
  }
}

function removeBlock(id: string) {
  blocks.value = blocks.value.filter(b => b.id !== id);
  if (selectedBlockId.value === id) selectedBlockId.value = null;
  pushHistory();
}

function togglePreview() {
  previewMode.value = !previewMode.value;
  if (previewMode.value) {
    updatePreviewHtml();
  }
}

function handleDragStart(id: string) {
  draggedBlockId.value = id;
}

function handleDragOver(index: number, position: 'before' | 'after') {
  dragOverIndex.value = index;
  dragOverPosition.value = position;
}

function handleDragLeave() {
  dragOverIndex.value = null;
  dragOverPosition.value = null;
}

function handleDrop(index?: number, position?: 'before' | 'after') {
  if (draggedBlockId.value === null) return;
  
  const fromIndex = blocks.value.findIndex(b => b.id === draggedBlockId.value);
  if (fromIndex === -1) return;

  let toIndex = index ?? blocks.value.length;
  if (position === 'after') toIndex++;

  if (fromIndex === toIndex || (fromIndex === toIndex - 1 && position === 'after')) {
    dragOverIndex.value = null;
    dragOverPosition.value = null;
    draggedBlockId.value = null;
    return;
  }

  const [moved] = blocks.value.splice(fromIndex, 1);
  blocks.value.splice(toIndex, 0, moved);
  pushHistory();
  
  dragOverIndex.value = null;
  dragOverPosition.value = null;
  draggedBlockId.value = null;
}

const previewHtml = computed(() => {
  if (!generateMJML) return '';
  try {
    const mjml = generateMJML(blocks.value);
    const { html } = mjml2html(mjml, { keepComments: true });
    return html;
  } catch (e) {
    console.error('MJML generation error:', e);
    return '<div style="padding: 20px; color: red;">Error generando vista previa</div>';
  }
});

function updatePreviewHtml() {
  // Trigger recomputation
}

async function exportMJML() {
  if (!generateMJML) await loadMJMLModule();
  const mjml = generateMJML(blocks.value);
  const blob = new Blob([mjml], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'email-template.mjml';
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  await loadMJMLModule();
  pushHistory();
});
</script>

<style scoped>
.drop-zone {
  transition: all 0.15s ease;
}
.block-container {
  transition: background-color 0.15s ease;
}
</style>