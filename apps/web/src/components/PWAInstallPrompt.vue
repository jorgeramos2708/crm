<template>
  <div v-if="showInstallPrompt" class="fixed bottom-4 right-4 z-50 animate-slide-up">
    <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 max-w-sm">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Icon name="download" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-zinc-900 dark:text-zinc-100">Instalar CRM</h4>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Agrega la app a tu pantalla de inicio para acceso rápido y uso offline
          </p>
        </div>
        <button @click="dismissInstall" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          <Icon name="x" class="h-5 w-5" />
        </button>
      </div>
      <div class="flex gap-2 mt-4">
        <Btn @click="install" variant="primary" class="flex-1" size="sm">
          Instalar
        </Btn>
        <Btn @click="dismissInstall" variant="ghost" class="flex-1" size="sm">
          Luego
        </Btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Icon from '../components/Icon.vue';
import Btn from '../components/Btn.vue';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const showInstallPrompt = ref(false);
let dismissed = false;

try {
  dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
} catch {}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

onMounted(() => {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  // Listen for beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    if (!dismissed) {
      showInstallPrompt.value = true;
    }
  });

  // Hide prompt after install
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });
});

onUnmounted(() => {
  // Cleanup
});

async function install() {
  if (!deferredPrompt) return;
  
  showInstallPrompt.value = false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('PWA installed');
  }
  
  deferredPrompt = null;
}

function dismissInstall() {
  showInstallPrompt.value = false;
  dismissed = true;
  try {
    localStorage.setItem('pwa-install-dismissed', 'true');
  } catch {}
}
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>