import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import {
  getPendingMutations,
  queueMutation,
  removeMutation,
  incrementRetryCount,
  setupOnlineListeners,
} from "./useOfflineDB";

const isOnline = ref(navigator.onLine);
const pendingMutationsCount = ref(0);
const syncInProgress = ref(false);
const lastSyncTime = ref<number | null>(null);

let syncInterval: ReturnType<typeof setInterval> | null = null;

async function loadPendingMutations() {
  try {
    const mutations = await getPendingMutations();
    pendingMutationsCount.value = mutations.filter(
      (m) => m.retryCount < 5,
    ).length;
  } catch (error) {
    console.error("Failed to load pending mutations:", error);
  }
}

async function triggerSync() {
  if (syncInProgress.value || !isOnline.value) return;

  syncInProgress.value = true;

  try {
    // Trigger service worker sync
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if ("sync" in registration) {
        await (registration as any).sync.register("sync-mutations");
      }
    }

    // Also try to process mutations directly
    const mutations = await getPendingMutations();
    for (const mutation of mutations) {
      if (mutation.retryCount >= 5) continue;

      try {
        const response = await fetch(mutation.endpoint, {
          method:
            mutation.type === "create"
              ? "POST"
              : mutation.type === "update"
                ? "PUT"
                : "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...mutation.body?.headers,
          },
          body: mutation.body ? JSON.stringify(mutation.body) : undefined,
          credentials: "include",
        });

        if (response.ok) {
          await removeMutation(mutation.id);
        } else {
          await incrementRetryCount(mutation.id);
        }
      } catch (error) {
        await incrementRetryCount(mutation.id);
      }
    }

    await loadPendingMutations();
    lastSyncTime.value = Date.now();
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    syncInProgress.value = false;
  }
}

export function usePWA() {
  const pendingCount = computed(() => pendingMutationsCount.value);

  function setupListeners() {
    const cleanup = setupOnlineListeners(
      async () => {
        isOnline.value = true;
        await loadPendingMutations();
        await triggerSync();
      },
      () => {
        isOnline.value = false;
      },
    );

    window.addEventListener("online", () => {
      isOnline.value = true;
    });
    window.addEventListener("offline", () => {
      isOnline.value = false;
    });

    return cleanup;
  }

  // Listen for messages from service worker
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  onMounted(async () => {
    await loadPendingMutations();
    setupListeners();

    // Listen for SW messages
    messageHandler = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        loadPendingMutations();
      }
    };
    navigator.serviceWorker?.addEventListener("message", messageHandler);

    // Periodic sync
    syncInterval = setInterval(async () => {
      if (isOnline.value && pendingMutationsCount.value > 0) {
        await triggerSync();
      }
    }, 60000);

    // Initial sync if online
    if (isOnline.value) {
      await triggerSync();
    }
  });

  onUnmounted(() => {
    if (syncInterval) clearInterval(syncInterval);
    if (messageHandler) {
      navigator.serviceWorker?.removeEventListener("message", messageHandler);
    }
  });

  return {
    isOnline,
    pendingMutationsCount,
    syncInProgress,
    lastSyncTime,
    pendingCount,
    triggerSync,
    queueMutation,
  };
}

// Re-export the IndexedDB functions
export * from "./useOfflineDB";
