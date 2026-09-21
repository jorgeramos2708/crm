import { ref } from 'vue'
import axios from 'axios'

// Marca del despliegue (nombre, color, logo, fondo, tema). Defaults = aspecto actual.
export const marca = ref({ nombre: 'CRM', color: '', logo: '', fondo: '', tema: { fondo: '#faf9f7', panel: '#f1eee7' } })

export async function loadMarca() {
  try {
    const { data } = await axios.get('/api/ajustes/marca')
    marca.value = {
      nombre: data.nombre || 'CRM',
      color: data.color || '',
      logo: data.logo || '',
      fondo: data.fondo || '',
      tema: data.tema || { fondo: '#faf9f7', panel: '#f1eee7' },
    }
  } catch {
    /* mantiene defaults */
  }
  applyMarca()
}

const TEMA_BASE = { fondo: '#faf9f7', panel: '#f1eee7' }

export function applyMarca() {
  try {
    document.title = marca.value.nombre === 'CRM' ? 'CRM' : `${marca.value.nombre} · CRM`
    const root = document.documentElement
    const t = marca.value.tema || TEMA_BASE
    const personalizado = marca.value.color || t.fondo !== TEMA_BASE.fondo || t.panel !== TEMA_BASE.panel
    if (personalizado) {
      if (marca.value.color) root.style.setProperty('--marca', marca.value.color)
      else root.style.removeProperty('--marca')
      root.style.setProperty('--fondo', t.fondo || TEMA_BASE.fondo)
      root.style.setProperty('--panel', t.panel || TEMA_BASE.panel)
      document.body.classList.add('tema-marca')
    } else {
      root.style.removeProperty('--marca')
      root.style.removeProperty('--fondo')
      root.style.removeProperty('--panel')
      document.body.classList.remove('tema-marca')
    }
  } catch { /* noop */ }
}
