import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// `self` es el ServiceWorkerGlobalScope en este contexto.

// Precache
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Skip waiting
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Runtime caching strategies

// API GET requests - StaleWhileRevalidate
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/") &&
    request.method === "GET" &&
    request.mode !== "navigate",
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

// API navigations - NetworkOnly
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/") && request.mode === "navigate",
  new NetworkOnly(),
);

// Static assets - CacheFirst
registerRoute(
  ({ url }) => url.pathname.match(/\.(js|css|woff2|svg|png|jpg|jpeg|gif|ico)$/),
  new CacheFirst({
    cacheName: "static-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Navigation requests - NetworkFirst with offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "navigation-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Push Notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, data, icon } = payload;

    const options = {
      body,
      icon: icon || "/icon.svg",
      badge: "/icon.svg",
      data: data || {},
      actions: [
        { action: "open", title: "Abrir" },
        { action: "dismiss", title: "Descartar" },
      ],
      requireInteraction: true,
      tag: data?.tag || "crm-notification",
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error("Push notification error:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        const url = event.notification.data?.url || "/";
        return self.clients.openWindow(url);
      }),
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});

// Background sync for offline mutations
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-mutations") {
    event.waitUntil(syncMutations());
  }
});

async function syncMutations() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_COMPLETE" });
    });
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

console.log("CRM Service Worker loaded");
