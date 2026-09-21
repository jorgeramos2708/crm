import { ref } from 'vue'

// Diálogo de confirmación propio (reemplaza confirm() nativo).
// Uso: const ok = await confirmar('¿Eliminar?')
const visible = ref(false)
const mensaje = ref('')
const detalle = ref('')
const peligro = ref(true)
let resolver = null

export function confirmar(msg, opts = {}) {
  mensaje.value = msg
  detalle.value = opts.detalle || ''
  peligro.value = opts.peligro !== false
  visible.value = true
  return new Promise((resolve) => { resolver = resolve })
}

function responder(valor) {
  visible.value = false
  if (resolver) {
    resolver(valor)
    resolver = null
  }
}

export const estadoConfirm = { visible, mensaje, detalle, peligro, responder }
