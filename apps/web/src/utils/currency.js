import { ref } from 'vue'
import axios from 'axios'

// Moneda del despliegue: USD o MXN (sin EUR). Se lee de /api/config.
export const currency = ref('USD')

const FORMATS = {
  USD: { locale: 'en-US', currency: 'USD' },
  MXN: { locale: 'es-MX', currency: 'MXN' },
}

export async function loadCurrency() {
  try {
    const { data } = await axios.get('/api/config')
    if (data.currency === 'MXN' || data.currency === 'USD') {
      currency.value = data.currency
    }
  } catch {
    /* mantiene USD por defecto */
  }
}

export function formatCurrency(value) {
  const fmt = FORMATS[currency.value] || FORMATS.USD
  return new Intl.NumberFormat(fmt.locale, { style: 'currency', currency: fmt.currency }).format(value || 0)
}
