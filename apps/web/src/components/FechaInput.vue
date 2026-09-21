<template>
  <input
    :value="texto"
    @input="onInput($event.target.value)"
    type="text"
    inputmode="numeric"
    placeholder="DD/MM/AAAA"
    :required="required"
    :class="$attrs.class || 'w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700'"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const isoAtexto = (iso) => {
  if (!iso) return ''
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

const texto = ref(isoAtexto(props.modelValue))

watch(() => props.modelValue, (v) => { texto.value = isoAtexto(v) })

const onInput = (v) => {
  const digitos = v.replace(/\D/g, '').slice(0, 8)
  let t = digitos
  if (t.length > 2) t = t.slice(0, 2) + '/' + t.slice(2)
  if (t.length > 5) t = t.slice(0, 5) + '/' + t.slice(5)
  texto.value = t
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    const valida = d.getFullYear() === Number(m[3]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1])
    emit('update:modelValue', valida ? `${m[3]}-${m[2]}-${m[1]}` : '')
  } else {
    emit('update:modelValue', '')
  }
}
</script>
