<template>
  <Modal
    :open="estadoConfirm.visible.value"
    title="Confirmar"
    max-width="max-w-sm"
    z="z-[70]"
    @close="estadoConfirm.responder(false)"
  >
    <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
      {{ estadoConfirm.mensaje.value }}
    </p>
    <p v-if="estadoConfirm.detalle.value" class="mt-1 text-xs text-zinc-500">
      {{ estadoConfirm.detalle.value }}
    </p>
    <template #actions>
      <Btn
        variant="outline"
        class="flex-1"
        @click="estadoConfirm.responder(false)"
        >Cancelar</Btn
      >
      <Btn
        class="flex-1"
        :variant="estadoConfirm.peligro.value ? 'danger' : 'primary'"
        @click="estadoConfirm.responder(true)"
        >Confirmar</Btn
      >
    </template>
  </Modal>
</template>

<script setup>
import { estadoConfirm } from "../utils/confirm";
import Modal from "./Modal.vue";
import Btn from "./Btn.vue";
</script>
