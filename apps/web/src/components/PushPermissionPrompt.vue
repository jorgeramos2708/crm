<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showPermissionPrompt"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="dismiss"
      >
        <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon name="bell" class="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">Activar notificaciones</h3>
            <p class="text-zinc-600 dark:text-zinc-400 mt-2">
              Recibe alertas en tiempo real sobre nuevas oportunidades, tareas asignadas y recordatorios
            </p>
          </div>

          <div class="space-y-3 mb-6">
            <div class="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
              <Icon name="mail" class="h-5 w-5 text-zinc-500 shrink-0" />
              <span class="text-sm text-zinc-700 dark:text-zinc-300">Nuevos emails y respuestas</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
              <Icon name="users" class="h-5 w-5 text-zinc-500 shrink-0" />
              <span class="text-sm text-zinc-700 dark:text-zinc-300">Tareas asignadas y menciones</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
              <Icon name="alert-triangle" class="h-5 w-5 text-zinc-500 shrink-0" />
              <span class="text-sm text-zinc-700 dark:text-zinc-300">Recordatorios de reuniones</span>
            </div>
            <div class="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
              <Icon name="trending-up" class="h-5 w-5 text-zinc-500 shrink-0" />
              <span class="text-sm text-zinc-700 dark:text-zinc-300">Cambios en pipeline y oportunidades</span>
            </div>
          </div>

          <div class="flex gap-2">
            <Btn @click="dismiss" variant="outline" class="flex-1">
              Ahora no
            </Btn>
            <Btn @click="enableNotifications" variant="primary" class="flex-1" :loading="requesting">
              {{ requesting ? 'Activando...' : 'Activar' }}
            </Btn>
          </div>

          <p class="text-xs text-zinc-500 text-center mt-4">
            Podrás gestionar esto luego en Configuración
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePushNotifications } from '@/composables/usePushNotifications';
import Btn from '../components/Btn.vue';
import Icon from '../components/Icon.vue';

const { permission, requestPermission, pushSupported } = usePushNotifications();

const showPermissionPrompt = ref(false);
const requesting = ref(false);
let dismissed = false;

try {
  dismissed = localStorage.getItem('push-permission-dismissed') === 'true';
} catch {}

onMounted(() => {
  // Only show if supported, not granted, and not dismissed
  if (pushSupported.value && permission.value === 'default' && !dismissed) {
    // Wait a bit for user to engage
    setTimeout(() => {
      if (!dismissed) {
        showPermissionPrompt.value = true;
      }
    }, 10000);
  }
});

async function enableNotifications() {
  requesting.value = true;
  try {
    const granted = await requestPermission();
    if (granted) {
      showPermissionPrompt.value = false;
    }
  } finally {
    requesting.value = false;
  }
}

function dismiss() {
  showPermissionPrompt.value = false;
  dismissed = true;
  try {
    localStorage.setItem('push-permission-dismissed', 'true');
  } catch {}
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>