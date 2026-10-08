<template>
  <div class="space-y-4">
    <!-- Text Block Properties -->
    <template v-if="type === 'text'">
      <div class="space-y-4">
        <Field label="Texto">
          <Input
            v-model="localContent.text"
            multiline
            :rows="4"
            class="w-full"
            @input="updateContent({ text: localContent.text })"
          />
        </Field>

        <Field label="Tamaño de fuente (px)">
          <Input
            v-model="localContent.fontSize"
            type="number"
            min="10"
            max="48"
            class="w-full"
            @input="updateContent({ fontSize: parseInt(localContent.fontSize) || 16 })"
          />
        </Field>

        <Field label="Color">
          <Input
            v-model="localContent.color"
            type="color"
            class="w-12 h-8 rounded border border-zinc-300 dark:border-zinc-600"
            @input="updateContent({ color: localContent.color })"
          />
          <Input
            v-model="localContent.color"
            type="text"
            class="w-full mt-1"
            placeholder="#1c1917"
            @input="updateContent({ color: localContent.color })"
          />
        </Field>

        <Field label="Alineación">
          <Select
            v-model="localContent.align"
            :options="[
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ]"
            @update:modelValue="v => updateContent({ align: v })"
          />
        </Field>

        <Field label="Familia de fuente">
          <Select
            v-model="localContent.fontFamily"
            :options="fontFamilies"
            @update:modelValue="v => updateContent({ fontFamily: v })"
          />
        </Field>
      </div>
    </template>

    <!-- Image Block Properties -->
    <template v-else-if="type === 'image'">
      <div class="space-y-4">
        <Field label="URL de la imagen">
          <Input
            v-model="localContent.src"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            class="w-full"
            @input="updateContent({ src: localContent.src })"
          />
        </Field>

        <Field label="Texto alternativo (alt)">
          <Input
            v-model="localContent.alt"
            type="text"
            placeholder="Descripción de la imagen"
            class="w-full"
            @input="updateContent({ alt: localContent.alt })"
          />
        </Field>

        <Field label="Ancho">
          <Input
            v-model="localContent.width"
            type="text"
            placeholder="100%"
            class="w-full"
            @input="updateContent({ width: localContent.width })"
          />
        </Field>

        <Field label="Enlace (opcional)">
          <Input
            v-model="localContent.href"
            type="url"
            placeholder="https://ejemplo.com"
            class="w-full"
            @input="updateContent({ href: localContent.href })"
          />
          <p class="text-xs text-zinc-500 mt-1">Deja vacío si no quieres que sea un enlace</p>
        </Field>

        <Field label="Alineación">
          <Select
            v-model="localContent.align"
            :options="[
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ]"
            @update:modelValue="v => updateContent({ align: v })"
          />
        </Field>
      </div>
    </template>

    <!-- Button Block Properties -->
    <template v-else-if="type === 'button'">
      <div class="space-y-4">
        <Field label="Texto del botón">
          <Input
            v-model="localContent.text"
            type="text"
            placeholder="Botón"
            class="w-full"
            @input="updateContent({ text: localContent.text })"
          />
        </Field>

        <Field label="Enlace (URL)">
          <Input
            v-model="localContent.href"
            type="url"
            placeholder="https://ejemplo.com"
            class="w-full"
            @input="updateContent({ href: localContent.href })"
          />
        </Field>

        <Field label="Color de fondo">
          <Input
            v-model="localContent.backgroundColor"
            type="color"
            class="w-12 h-8 rounded border border-zinc-300 dark:border-zinc-600"
            @input="updateContent({ backgroundColor: localContent.backgroundColor })"
          />
          <Input
            v-model="localContent.backgroundColor"
            type="text"
            class="w-full mt-1"
            placeholder="#2563eb"
            @input="updateContent({ backgroundColor: localContent.backgroundColor })"
          />
        </Field>

        <Field label="Color del texto">
          <Input
            v-model="localContent.color"
            type="color"
            class="w-12 h-8 rounded border border-zinc-300 dark:border-zinc-600"
            @input="updateContent({ color: localContent.color })"
          />
          <Input
            v-model="localContent.color"
            type="text"
            class="w-full mt-1"
            placeholder="#ffffff"
            @input="updateContent({ color: localContent.color })"
          />
        </Field>

        <Field label="Radio de borde (px)">
          <Input
            v-model="localContent.borderRadius"
            type="number"
            min="0"
            max="50"
            class="w-full"
            @input="updateContent({ borderRadius: parseInt(localContent.borderRadius) || 4 })"
          />
        </Field>

        <Field label="Padding">
          <Input
            v-model="localContent.padding"
            type="text"
            placeholder="12px 24px"
            class="w-full"
            @input="updateContent({ padding: localContent.padding })"
          />
        </Field>

        <Field label="Alineación">
          <Select
            v-model="localContent.align"
            :options="[
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ]"
            @update:modelValue="v => updateContent({ align: v })"
          />
        </Field>
      </div>
    </template>

    <!-- Divider Block Properties -->
    <template v-else-if="type === 'divider'">
      <div class="space-y-4">
        <Field label="Color">
          <Input
            v-model="localContent.color"
            type="color"
            class="w-12 h-8 rounded border border-zinc-300 dark:border-zinc-600"
            @input="updateContent({ color: localContent.color })"
          />
          <Input
            v-model="localContent.color"
            type="text"
            class="w-full mt-1"
            placeholder="#e8e3d9"
            @input="updateContent({ color: localContent.color })"
          />
        </Field>

        <Field label="Ancho">
          <Input
            v-model="localContent.width"
            type="text"
            placeholder="100%"
            class="w-full"
            @input="updateContent({ width: localContent.width })"
          />
        </Field>

        <Field label="Altura (px)">
          <Input
            v-model="localContent.height"
            type="number"
            min="1"
            max="10"
            class="w-full"
            @input="updateContent({ height: parseInt(localContent.height) || 1 })"
          />
        </Field>
      </div>
    </template>

    <!-- Spacer Block Properties -->
    <template v-else-if="type === 'spacer'">
      <div class="space-y-4">
        <Field label="Altura (px)">
          <Input
            v-model="localContent.height"
            type="number"
            min="0"
            max="200"
            class="w-full"
            @input="updateContent({ height: parseInt(localContent.height) || 20 })"
          />
        </Field>
      </div>
    </template>

    <template v-else>
      <p class="text-zinc-500 text-center py-8">No hay propiedades para este tipo de bloque</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BLOCK_TYPES } from '@/utils/mjml/generateMJML.mjs';
import Input from './Input.vue';
import Select from './Select.vue';
import Field from './Field.vue';

defineProps<{
  block: {
    id: string;
    type: string;
    content: Record<string, any>;
  };
}>();

defineEmits<{
  update: [id: string, content: Record<string, any>];
}>();

const type = computed(() => props.block.type);
const blockType = computed(() => BLOCK_TYPES[props.block.type] || { name: 'Desconocido' });

const localContent = ref({ ...props.block.content });

watch(localContent, (newContent) => {
  $emit('update', props.block.id, newContent);
}, { deep: true });

const fontFamilies = [
  { value: 'Plus Jakarta Sans, Arial, sans-serif', label: 'Plus Jakarta Sans (por defecto)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
];</script>
