<!-- PageTransition: transiciones entre páginas/routes.
  Usa: <PageTransition mode="out-in"><router-view v-slot="{ Component }"><component :is="Component" /></router-view></PageTransition> -->
<template>
  <Transition name="page" mode="out-in" appear>
    <slot />
  </Transition>
</template>

<script setup>
defineProps({
  name: { type: String, default: 'page' },
  mode: { type: String, default: 'out-in' },
});
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-active {
  position: absolute;
  width: 100%;
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none !important;
  }
}
</style>