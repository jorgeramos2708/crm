<template>
  <div class="block-renderer">
    <template v-if="type === 'text'">
      <div
        :style="{
          fontSize: content.fontSize + 'px',
          color: content.color,
          textAlign: content.align,
          fontFamily: 'Plus Jakarta Sans, Arial, sans-serif',
          lineHeight: 1.5,
        }"
        v-html="content.text"
      />
    </template>

    <template v-else-if="type === 'image'">
      <div :style="{ textAlign: content.align || 'center' }">
        <a v-if="content.href" :href="content.href" target="_blank" rel="noopener noreferrer">
          <img
            :src="content.src"
            :alt="content.alt"
            :style="{ width: content.width, maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '4px' }"
          />
        </a>
        <img
          v-else
          :src="content.src"
          :alt="content.alt"
          :style="{ width: content.width, maxWidth: '100%', height: 'auto', display: 'block', borderRadius: '4px' }"
        />
      </div>
    </template>

    <template v-else-if="type === 'button'">
      <div :style="{ textAlign: content.align || 'center', margin: '16px 0' }">
        <a
          :href="content.href"
          target="_blank"
          rel="noopener noreferrer"
          :style="{
            display: 'inline-block',
            backgroundColor: content.backgroundColor,
            color: content.color,
            borderRadius: content.borderRadius + 'px',
            padding: content.padding,
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '14px',
            fontFamily: 'Plus Jakarta Sans, Arial, sans-serif',
          }"
        >
          {{ content.text }}
        </a>
      </div>
    </template>

    <template v-else-if="type === 'divider'">
      <hr
        :style="{
          borderColor: content.color,
          borderWidth: content.height + 'px',
          width: content.width,
          borderStyle: 'solid',
          margin: '16px 0',
        }"
      />
    </template>

    <template v-else-if="type === 'spacer'">
      <div :style="{ height: content.height + 'px' }" />
    </template>

    <template v-else>
      <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
        Tipo de bloque desconocido: {{ type }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  block: {
    id: string;
    type: string;
    content: Record<string, any>;
  };
  selected?: boolean;
}>();

defineEmits<{
  update: [id: string, content: Record<string, any>];
  delete: [id: string];
}>();

const type = computed(() => props.block.type);
const content = computed(() => props.block.content);

function emitUpdate(content: Record<string, any>) {
  $emit('update', props.block.id, content);
}

function emitDelete() {
  $emit('delete', props.block.id);
}
</script>

<style scoped>
.block-renderer {
  transition: all 0.2s ease;
}
</style>