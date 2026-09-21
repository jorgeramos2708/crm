<template>
  <div v-if="estadoConfirm.visible.value" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" @click.self="estadoConfirm.responder(false)">
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
      <h2 class="text-lg font-semibold">Confirmar</h2>
      <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{{ estadoConfirm.mensaje.value }}</p>
      <p v-if="estadoConfirm.detalle.value" class="mt-1 text-xs text-zinc-500">{{ estadoConfirm.detalle.value }}</p>
      <div class="mt-5 flex gap-2">
        <button @click="estadoConfirm.responder(false)" class="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600">Cancelar</button>
        <button
          @click="estadoConfirm.responder(true)"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
          :class="estadoConfirm.peligro.value ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-900 hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900'"
        >Confirmar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { estadoConfirm } from '../utils/confirm'
</script>
