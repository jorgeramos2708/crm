<!-- Table (Fase 2): contenedor con scroll horizontal + tabla base.
  Columnas por slots: #head para la fila de <th>, default para las filas del <tbody>.
  Los estados (cargando/vacío con su colspan) los pone el llamador. -->
<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-zinc-50 dark:bg-zinc-700/50">
        <slot name="head" />
      </thead>
      <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
        <slot />
      </tbody>
    </table>
  </div>
</template>
