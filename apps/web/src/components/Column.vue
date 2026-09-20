<template>
  <div
    class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 min-w-[280px] flex-shrink-0 flex flex-col"
    :style="{ borderTopColor: stage.color || '#3b82f6', minHeight: '500px' }"
    @dragover.prevent
    @dragleave.prevent
    @drop="handleDrop"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stage.color || '#3b82f6' }"></div>
        <h3 class="text-lg font-medium text-zinc-900 dark:text-zinc-400">{{ stage.nombre }}</h3>
      </div>
      <span class="text-sm text-zinc-500">{{ (oportunidades || []).length }} oportunidades</span>
    </div>

    <div class="space-y-2 flex-1 overflow-y-auto">
      <OportunidadCard
        v-for="opp in oportunidades"
        :key="opp.id"
        :oportunidad="opp"
        :arrastrando="arrastrando"
        :oportunidadArrastrando="oportunidadArrastrando"
        @drag-start="$emit('drag-start', $event, opp.id)"
        @drag-end="$emit('drag-end')"
      />
      <div v-if="(oportunidades || []).length === 0" class="p-4 text-center text-zinc-400 dark:text-zinc-600">
        <p>No hay oportunidades</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stage: Object,
  oportunidades: Array,
  arrastrando: Boolean,
  oportunidadArrastrando: [String, Number, null],
})

defineEmits(['drag-start', 'drag-end', 'drop'])
</script>