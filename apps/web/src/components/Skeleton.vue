<template>
  <div class="space-y-2" aria-hidden="true">
    <div v-for="i in filas" :key="i" class="flex items-center gap-3">
      <div class="h-4 flex-1 skeleton-shimmer rounded-lg" :style="{ width: anchos[i % anchos.length] + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filas: { type: Number, default: 5 },
})

const anchos = [96, 82, 91, 74, 88, 79]
</script>
