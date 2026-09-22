<!-- Table: contenedor con scroll horizontal + tabla base con animaciones.
  Columnas por slots: #head para la fila de <th>, default para las filas del <tbody>.
  Los estados (cargando/vacío con su colspan) los pone el llamador. -->
<template>
  <div class="overflow-x-auto">
    <table :class="cols && cols.length ? 'w-full table-fixed' : 'w-full'">
      <colgroup v-if="cols && cols.length">
        <col v-for="(c, i) in cols" :key="i" :style="typeof c === 'object' ? c : { width: c }" />
      </colgroup>
      <thead class="bg-zinc-50 dark:bg-zinc-700/50">
        <slot name="head" />
      </thead>
      <TransitionGroup
        name="table-row"
        tag="tbody"
        class="divide-y divide-zinc-200 dark:divide-zinc-700"
      >
        <slot />
      </TransitionGroup>
    </table>
  </div>
</template>

<script>
export default {
  name: 'Table',
  props: {
    cols: { type: Array, default: null },
  },
};
</script>
