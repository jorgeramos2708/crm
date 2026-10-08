import { ref } from "vue";

// Toasts no bloqueantes (reemplazan alert()).
// Uso: toast.exito('Guardado'), toast.error('...'), toast.info('...')
const items = ref([]);
let seq = 0;

function push(tipo, texto) {
  const id = ++seq;
  items.value.push({ id, tipo, texto });
  setTimeout(() => {
    items.value = items.value.filter((t) => t.id !== id);
  }, 4200);
}

export const toast = {
  exito: (texto, options) => push("exito", texto),
  error: (texto, options) => push("error", texto),
  info: (texto, options) => push("info", texto),
  warning: (texto, options) => push("warning", texto),
};

export const estadoToasts = { items };
