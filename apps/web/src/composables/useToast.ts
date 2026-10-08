import { ref, computed, nextTick } from "vue";

export interface Toast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
  undo?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  duration?: number;
  createdAt: number;
}

export interface UndoAction {
  id: number;
  label: string;
  undo: () => void | Promise<void>;
  timestamp: number;
}

export const toasts = ref<Toast[]>([]);
export const undoStack = ref<UndoAction[]>([]);
let toastId = 0;
let undoId = 0;
const MAX_UNDO_STACK = 5;
const MAX_TOASTS = 3;

function addToast(toast: Omit<Toast, "id" | "createdAt">) {
  const newToast: Toast = {
    ...toast,
    id: ++toastId,
    createdAt: Date.now(),
  };

  toasts.value = [...toasts.value, newToast].slice(-MAX_TOASTS);

  if (newToast.duration !== 0) {
    const duration = newToast.duration ?? 5000;
    setTimeout(() => {
      removeToast(newToast.id);
    }, duration);
  }

  return newToast.id;
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function pushUndoAction(action: Omit<UndoAction, "id" | "timestamp">) {
  const newAction: UndoAction = {
    ...action,
    id: ++undoId,
    timestamp: Date.now(),
  };

  undoStack.value = [newAction, ...undoStack.value].slice(0, MAX_UNDO_STACK);
}

function popUndoAction(): UndoAction | undefined {
  return undoStack.value.shift();
}

function createToastMethods() {
  const success = (
    message: string,
    options?: {
      undo?: { label: string; onClick: () => void | Promise<void> };
      duration?: number;
    },
  ) => {
    if (options?.undo) {
      addToast({
        type: "success",
        message,
        undo: options.undo,
        duration: options.duration,
      });
      pushUndoAction({
        label: options.undo.label,
        undo: options.undo.onClick,
      });
    } else {
      addToast({ type: "success", message, duration: options?.duration });
    }
  };

  const error = (
    message: string,
    options?: {
      undo?: { label: string; onClick: () => void | Promise<void> };
      duration?: number;
    },
  ) => {
    if (options?.undo) {
      addToast({
        type: "error",
        message,
        undo: options.undo,
        duration: options.duration,
      });
      pushUndoAction({
        label: options.undo.label,
        undo: options.undo.onClick,
      });
    } else {
      addToast({ type: "error", message, duration: options?.duration });
    }
  };

  const warning = (
    message: string,
    options?: {
      undo?: { label: string; onClick: () => void | Promise<void> };
      duration?: number;
    },
  ) => {
    if (options?.undo) {
      addToast({
        type: "warning",
        message,
        undo: options.undo,
        duration: options.duration,
      });
      pushUndoAction({
        label: options.undo.label,
        undo: options.undo.onClick,
      });
    } else {
      addToast({ type: "warning", message, duration: options?.duration });
    }
  };

  const info = (
    message: string,
    options?: {
      undo?: { label: string; onClick: () => void | Promise<void> };
      duration?: number;
    },
  ) => {
    if (options?.undo) {
      addToast({
        type: "info",
        message,
        undo: options.undo,
        duration: options.duration,
      });
      pushUndoAction({
        label: options.undo.label,
        undo: options.undo.onClick,
      });
    } else {
      addToast({ type: "info", message, duration: options?.duration });
    }
  };

  return {
    success,
    error,
    warning,
    info,
  };
}

export function useToast() {
  return createToastMethods();
}

export function useUndoStack() {
  const canUndo = computed(() => undoStack.value.length > 0);

  const undo = async () => {
    const action = popUndoAction();
    if (action) {
      await action.undo();
      return true;
    }
    return false;
  };

  return {
    canUndo,
    undoStack: computed(() => undoStack.value),
    undo,
  };
}

export function useToasts() {
  return {
    toasts: computed(() => toasts.value),
    removeToast,
  };
}
