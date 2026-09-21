<!-- Btn (Fase 1): botón del sistema de diseño.
  Variantes (clases copiadas 1:1 de los patrones existentes):
    primary  - bg-zinc-900 (ex: "Redactar" en Correos)
    outline  - borde + hover sutil (ex: "Actualizar" en Correos)
    ghost    - solo hover (ex: cerrar menú móvil en App)
    link     - texto azul subrayado (ex: "Crea la primera" en Dashboard)
    danger   - rojo (ex: "Confirmar" peligroso en ConfirmDialog)
  Tamaños: sm (px-3 py-1 text-xs), md (px-4 py-2 text-sm).
  `to` renderiza router-link, `href` un <a>, si no un <button>.
  Clases/atributos extra (class, title, @click) se heredan al elemento raíz. -->
<template>
  <component
    :is="tag"
    :to="tag === RouterLink ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :target="tag === 'a' && target ? target : undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-disabled="
      tag !== 'button' && (disabled || loading) ? 'true' : undefined
    "
    :class="classes"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <slot />
  </component>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  variant: { type: String, default: "primary" },
  size: { type: String, default: "md" },
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  target: { type: String, default: null },
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});

const tag = computed(() =>
  props.to ? RouterLink : props.href ? "a" : "button",
);

const variants = {
  primary:
    "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:opacity-90",
  secondary:
    "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:opacity-90",
  outline:
    "border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700",
  ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-700",
  link: "text-blue-600 hover:underline",
  "link-danger": "text-red-600 hover:underline",
  danger: "bg-red-600 text-white font-medium hover:bg-red-700",
  "success-soft":
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:opacity-90",
  "danger-soft":
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-1 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 rounded-lg",
};

const classes = computed(() => {
  const cls = [
    "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
    variants[props.variant] || variants.primary,
  ];
  if (props.variant === "ghost") cls.push("rounded-xl p-2");
  else if (!["link", "link-danger"].includes(props.variant))
    cls.push(sizes[props.size] || sizes.md);
  if (tag.value !== "button" && (props.disabled || props.loading))
    cls.push("pointer-events-none opacity-50");
  return cls;
});
</script>
