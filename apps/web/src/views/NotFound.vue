<template>
  <div class="min-h-[60vh] flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <p class="text-6xl font-bold tabular-nums text-[var(--fg-subtle)]">404</p>
      <h1 class="mt-2 text-xl font-semibold text-[var(--fg)]">Página no encontrada</h1>
      <p class="mt-1 text-sm text-[var(--fg-muted)]">
        La ruta que buscas no existe o fue movida.
      </p>
      <Btn variant="primary" size="sm" to="/" class="mt-6">
        Volver al Resumen
      </Btn>
    </div>
  </div>
</template>

<script setup>
import Btn from "../components/Btn.vue";
</script>
