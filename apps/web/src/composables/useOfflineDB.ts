import { openDB } from "idb";

const DB_NAME = "crm-offline";
const DB_VERSION = 1;

export interface OfflineMutation {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  body: any;
  timestamp: number;
  retryCount: number;
}

export interface CachedEntity {
  id: string;
  entityType: string;
  data: any;
  timestamp: number;
  etag?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function getOfflineDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Mutations queue for background sync
        if (!db.objectStoreNames.contains("mutations")) {
          const mutationStore = db.createObjectStore("mutations", {
            keyPath: "id",
          });
          mutationStore.createIndex("timestamp", "timestamp");
          mutationStore.createIndex("endpoint", "endpoint");
        }

        // Cached entities for offline reads
        if (!db.objectStoreNames.contains("cache")) {
          const cacheStore = db.createObjectStore("cache", { keyPath: "id" });
          cacheStore.createIndex("entityType", "entityType");
          cacheStore.createIndex("timestamp", "timestamp");
        }

        // Pending push subscriptions
        if (!db.objectStoreNames.contains("pushSubscriptions")) {
          db.createObjectStore("pushSubscriptions", { keyPath: "id" });
        }

        // Offline outbox for failed requests
        if (!db.objectStoreNames.contains("outbox")) {
          const outboxStore = db.createObjectStore("outbox", { keyPath: "id" });
          outboxStore.createIndex("endpoint", "endpoint");
          outboxStore.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

// Mutation queue operations
export async function queueMutation(
  mutation: Omit<OfflineMutation, "id" | "timestamp" | "retryCount">,
) {
  const db = await getOfflineDB();
  const id = crypto.randomUUID();
  const fullMutation: OfflineMutation = {
    ...mutation,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await db.put("mutations", fullMutation);
  return fullMutation;
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("mutations", "timestamp");
}

export async function removeMutation(id: string) {
  const db = await getOfflineDB();
  await db.delete("mutations", id);
}

export async function incrementRetryCount(id: string) {
  const db = await getOfflineDB();
  const mutation = await db.get("mutations", id);
  if (mutation) {
    mutation.retryCount++;
    await db.put("mutations", mutation);
  }
}

// Cache operations
export async function cacheEntity(entity: Omit<CachedEntity, "timestamp">) {
  const db = await getOfflineDB();
  await db.put("cache", {
    ...entity,
    timestamp: Date.now(),
  });
}

export async function getCachedEntity(
  id: string,
): Promise<CachedEntity | undefined> {
  const db = await getOfflineDB();
  return db.get("cache", id);
}

export async function getCachedEntitiesByType(
  entityType: string,
): Promise<CachedEntity[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("cache", "entityType", entityType);
}

export async function clearOldCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const db = await getOfflineDB();
  const cutoff = Date.now() - maxAgeMs;
  const allEntries = await db.getAll("cache");
  for (const entry of allEntries) {
    if (entry.timestamp < cutoff) {
      await db.delete("cache", entry.id);
    }
  }
}

// Push subscription operations
export async function savePushSubscription(subscription: PushSubscription) {
  const db = await getOfflineDB();
  const id = subscription.endpoint;
  await db.put("pushSubscriptions", {
    id,
    endpoint: subscription.endpoint,
    keys: subscription.toJSON().keys,
    createdAt: Date.now(),
  });
}

export async function getPushSubscriptions(): Promise<
  { id: string; endpoint: string; keys: any }[]
> {
  const db = await getOfflineDB();
  return db.getAll("pushSubscriptions");
}

export async function removePushSubscription(endpoint: string) {
  const db = await getOfflineDB();
  await db.delete("pushSubscriptions", endpoint);
}

// Outbox for failed requests
export async function addToOutbox(request: {
  endpoint: string;
  method: string;
  body: any;
  headers: Record<string, string>;
}) {
  const db = await getOfflineDB();
  const id = crypto.randomUUID();
  await db.put("outbox", {
    id,
    ...request,
    timestamp: Date.now(),
    retryCount: 0,
  });
}

export async function getOutbox(): Promise<any[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex("outbox", "timestamp");
}

export async function removeFromOutbox(id: string) {
  const db = await getOfflineDB();
  await db.delete("outbox", id);
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Register online/offline listeners
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void,
) {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
