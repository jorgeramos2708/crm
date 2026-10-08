<template>
  <div class="toast-container" role="region" aria-live="polite" aria-label="Notificaciones">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="[`toast--${toast.type}`, { 'toast--visible': visible.get(toast.id) }]"
      role="alert"
      @mouseenter="pauseTimer(toast.id)"
      @mouseleave="resumeTimer(toast.id)"
    >
      <div class="toast__icon">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>

      <div class="toast__content">
        <p class="toast__message">{{ toast.message }}</p>
        <div v-if="toast.undo" class="toast__actions">
          <button
            class="toast__undo-btn"
            @click="handleUndo(toast)"
          >
            {{ toast.undo.label }}
          </button>
        </div>
      </div>

      <button class="toast__close" @click="removeToast(toast.id)" aria-label="Cerrar notificación">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div class="toast__progress" :style="{ width: progress.get(toast.id) + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useToasts } from "@/composables/useToast";

const { toasts, removeToast } = useToasts();

const visible = new Map<number, boolean>();
const progress = new Map<number, number>();
const timers = new Map<number, ReturnType<typeof setInterval>>();

const startTimer = (id: number, duration: number) => {
  if (timers.has(id)) return;

  let elapsed = 0;
  const interval = 50;
  const total = duration || 5000;

  const timer = setInterval(() => {
    elapsed += interval;
    const pct = Math.max(0, 100 - (elapsed / total) * 100);
    progress.set(id, pct);

    if (elapsed >= total) {
      clearInterval(timer);
      timers.delete(id);
      removeToast(id);
    }
  }, interval);

  timers.set(id, timer);
};

const pauseTimer = (id: number) => {
  const timer = timers.get(id);
  if (timer) {
    clearInterval(timer);
    timers.delete(id);
  }
};

const resumeTimer = (id: number) => {
  const toast = toastList.value.find((t) => t.id === id);
  if (toast) {
    const elapsed = 5000 - (progress.get(id) / 100) * 5000;
    startTimer(id, 5000 - elapsed);
  }
};

const handleUndo = async (toast: any) => {
  pauseTimer(toast.id);
  if (toast.undo?.onClick) {
    await toast.undo.onClick();
  }
  removeToast(toast.id);
};

const toastList = computed(() => toasts.value);

watch(
  () => toasts.value,
  (newToasts) => {
    newToasts.forEach((toast) => {
      if (!visible.has(toast.id)) {
        visible.set(toast.id, false);
        progress.set(toast.id, 100);

        nextTick(() => {
          visible.set(toast.id, true);
          startTimer(toast.id, toast.duration || 5000);
        });
      }
    });

    // Clean up removed toasts
    visible.forEach((_, id) => {
      if (!newToasts.some((t) => t.id === id)) {
        visible.delete(id);
        progress.delete(id);
        const timer = timers.get(id);
        if (timer) {
          clearInterval(timer);
          timers.delete(id);
        }
      }
    });
  },
  { immediate: true }
);
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 380px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: var(--crm-radius-lg, 0.75rem);
  background: var(--crm-card, #fff);
  border: 1px solid var(--crm-border, #e2e8f0);
  box-shadow: var(--crm-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: auto;
  min-width: 300px;
  max-width: 380px;
}

.toast--visible {
  opacity: 1;
  transform: translateX(0);
}

.toast--success {
  border-left: 4px solid var(--crm-success, #22c55e);
}
.toast--error {
  border-left: 4px solid var(--crm-destructive, #ef4444);
}
.toast--warning {
  border-left: 4px solid var(--crm-warning, #eab308);
}
.toast--info {
  border-left: 4px solid var(--crm-info, #3b82f6);
}

.toast__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 2px;
}
.toast--success .toast__icon { color: var(--crm-success, #22c55e); }
.toast--error .toast__icon { color: var(--crm-destructive, #ef4444); }
.toast--warning .toast__icon { color: var(--crm-warning, #eab308); }
.toast--info .toast__icon { color: var(--crm-info, #3b82f6); }

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--crm-fg, #1c1917);
  margin: 0 0 0.5rem 0;
}

.toast__actions {
  display: flex;
  gap: 0.5rem;
}

.toast__undo-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--crm-brand, #2563eb);
  background: transparent;
  border: 1px solid var(--crm-brand, #2563eb);
  border-radius: var(--crm-radius-sm, 0.375rem);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.toast__undo-btn:hover {
  background: var(--crm-brand, #2563eb);
  color: var(--crm-brand-fg, #fff);
}

.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--crm-muted-fg, #78716c);
  background: transparent;
  border: none;
  border-radius: var(--crm-radius-sm, 0.375rem);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}
.toast__close:hover {
  color: var(--crm-fg, #1c1917);
  background: var(--crm-muted, #f4f2ed);
}

.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  border-radius: 0 0 var(--crm-radius-lg, 0.75rem) var(--crm-radius-lg, 0.75rem);
  transition: width 0.1s linear;
}
.toast--success .toast__progress { color: var(--crm-success, #22c55e); }
.toast--error .toast__progress { color: var(--crm-destructive, #ef4444); }
.toast--warning .toast__progress { color: var(--crm-warning, #eab308); }
.toast--info .toast__progress { color: var(--crm-info, #3b82f6); }

@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: none;
  }
}
</style>