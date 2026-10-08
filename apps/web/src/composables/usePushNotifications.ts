import { ref, onMounted, onUnmounted } from "vue";
import {
  savePushSubscription,
  getPushSubscriptions,
  removePushSubscription,
} from "./useOfflineDB";

const permission = ref<NotificationPermission>("default");
const subscription = ref<PushSubscription | null>(null);
const pushSupported = ref(false);
const vapidPublicKey = ref<string>("");

async function initPushNotifications(publicKey: string) {
  vapidPublicKey.value = publicKey;

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    pushSupported.value = false;
    return false;
  }

  pushSupported.value = true;

  // Check current permission
  permission.value = Notification.permission;

  // Get existing subscription
  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    subscription.value = existingSubscription;
    await savePushSubscription(existingSubscription);
  }

  return true;
}

async function requestPermission() {
  if (!pushSupported.value) return false;

  const result = await Notification.requestPermission();
  permission.value = result;

  if (result === "granted") {
    await subscribe();
  }

  return result === "granted";
}

async function subscribe() {
  if (!pushSupported.value || permission.value !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey.value),
    });

    subscription.value = subscription;
    await savePushSubscription(subscription);

    // Send subscription to server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    throw error;
  }
}

async function unsubscribe() {
  if (!subscription.value) return;

  try {
    await subscription.value.unsubscribe();
    subscription.value = null;

    // Remove from local storage
    // Find by endpoint
    const subscriptions = await getPushSubscriptions();
    const localSub = subscriptions.find(
      (s) => s.endpoint === subscription.value?.endpoint,
    );
    if (localSub) {
      await removePushSubscription(localSub.id);
    }

    // Notify server
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.value?.endpoint }),
      credentials: "include",
    });

    subscription.value = null;
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    throw error;
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
      }),
      credentials: "include",
    });
  } catch (error) {
    console.error("Failed to send subscription to server:", error);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const permission = ref<NotificationPermission>("default");
  const subscription = ref<PushSubscription | null>(null);
  const pushSupported = ref(false);
  const vapidPublicKey = ref("");

  onMounted(async () => {
    // Load VAPID key from server
    try {
      const response = await fetch("/api/push/vapid-key", {
        credentials: "include",
      });
      const data = await response.json();
      vapidPublicKey.value = data.publicKey;
      await initPushNotifications(vapidPublicKey.value);
    } catch (error) {
      console.error("Failed to load VAPID key:", error);
    }
  });

  return {
    permission,
    subscription,
    pushSupported,
    vapidPublicKey,
    initPushNotifications,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
