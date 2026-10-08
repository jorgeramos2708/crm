<template>
  <Transition name="fade" mode="out-in">
    <div
      v-if="!isOnline"
      key="offline"
      class="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium shadow-lg animate-pulse"
    >
      <div class="flex items-center justify-center gap-2">
        <Icon name="wifi-off" class="h-4 w-4" />
        <span>Sin conexión — Trabajando en modo offline</span>
        <span v-if="pendingCount > 0" class="bg-white/20 px-2 py-0.5 rounded text-xs">
          {{ pendingCount }} cambios pendientes
        </span>
      </div>
    </div>

    <div
      v-else-if="justCameOnline"
      key="online"
      class="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-center py-2 px-4 text-sm font-medium shadow-lg"
    >
      <div class="flex items-center justify-center gap-2">
        <Icon name="wifi" class="h-4 w-4" />
        <span>Conexión restaurada — Sincronizando...</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { usePWA } from '@/composables/usePWA';
import Icon from '../components/Icon.vue';

const { isOnline, pendingMutationsCount, triggerSync } = usePWA();

const justCameOnline = ref(false);

onMounted(() => {
  // Watch for online/offline changes
  const unwatch = watch(isOnline, (newVal, oldVal) => {
    if (!oldVal && newVal) {
      justCameOnline.value = true;
      triggerSync();
      setTimeout(() => {
        justCameOnline.value = false;
      }, 3000);
    }
  });

  return () => unwatch();
});

const pendingCount = computed(() => pendingMutationsCount.value);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>