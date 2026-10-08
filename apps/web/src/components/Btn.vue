<!-- Btn (Premium): botón del sistema de diseño con micro-interacciones premium
  Variantes:
    primary    - brand gradient con glow y elevación
    secondary  - surface sutil con borde
    outline    - borde transparente, hover surface
    ghost      - transparente, hover surface
    link       - texto brand, underline hover
    danger     - destructive gradient con glow
    success    - success gradient con glow
    icon       - botón circular para acciones de icono
  Tamaños: xs, sm, md, lg, xl
  `to` renderiza router-link, `href` un <a>, si no un <button>.
  Estados: loading (spinner), disabled, pressed (micro-interacción) -->
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
    :aria-busy="loading"
    :class="[
      classes,
      { 'btn-pressed': pressed && !disabled && !loading },
      { 'btn-loading': loading },
      { 'btn-ripple-active': ripple },
    ]"
    :style="btnStyle"
    @mousedown.prevent="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <span class="btn-content flex items-center justify-center gap-2">
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
    </span>

    <!-- Ripple effect -->
    <span
      v-if="ripple"
      class="btn-ripple"
      :style="rippleStyle"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (v) => [
      "primary", "secondary", "outline", "ghost", "link",
      "danger", "success", "icon", "link-danger"
    ].includes(v),
  },
  size: {
    type: String,
    default: "md",
    validator: (v) => ["xs", "sm", "md", "lg", "xl"].includes(v),
  },
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

const pressed = ref(false);
const ripple = ref(false);
const ripplePos = ref({ x: 0, y: 0 });

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  link: "btn-link",
  "link-danger": "btn-link-danger",
  danger: "btn-danger",
  success: "btn-success",
  icon: "btn-icon",
};

const sizes = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  xl: "btn-xl",
};

const classes = computed(() => {
  const cls = [
    "btn",
    variants[props.variant] || variants.primary,
    sizes[props.size] || sizes.md,
    "transition-all duration-fast ease-out",
    "focus-ring",
    "press-scale",
  ];

  if (props.variant === "icon") {
    cls.push("btn-icon");
  }

  if (["link", "link-danger"].includes(props.variant)) {
    cls.push("btn-link-base");
  }

  if (tag.value !== "button" && (props.disabled || props.loading)) {
    cls.push("pointer-events-none opacity-50");
  }

  return cls.join(" ");
});

const btnStyle = computed(() => {
  if (props.variant === "primary" || props.variant === "icon") {
    return { background: "linear-gradient(135deg, var(--brand), var(--brand-hover))" };
  }
  if (props.variant === "link") {
    return { color: "var(--brand)" };
  }
  if (props.variant === "link-danger") {
    return { color: "var(--destructive)" };
  }
  return {};
});

const rippleStyle = computed(() => ({
  left: `${ripplePos.value.x}px`,
  top: `${ripplePos.value.y}px`,
}));

function onMouseDown(e) {
  if (props.disabled || props.loading) return;
  if (e.button !== 0) return; // Only left click

  pressed.value = true;
  ripple.value = true;
  const rect = e.currentTarget.getBoundingClientRect();
  ripplePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  // Auto-cleanup ripple
  setTimeout(() => {
    ripple.value = false;
  }, 600);
}

function onMouseUp() {
  pressed.value = false;
}

function onMouseLeave() {
  pressed.value = false;
}

function onTouchStart(e) {
  if (props.disabled || props.loading) return;
  pressed.value = true;
  ripple.value = true;
  const rect = e.currentTarget.getBoundingClientRect();
  const touch = e.touches[0];
  ripplePos.value = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

function onTouchEnd() {
  pressed.value = false;
  setTimeout(() => { ripple.value = false; }, 300);
}

function onTouchCancel() {
  pressed.value = false;
  ripple.value = false;
}

onMounted(() => {
  // Prevent context menu on long press for icon buttons
  if (props.variant === "icon") {
    // Handled by touch events
  }
});
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes ripple-animation {
  0% {
    transform: scale(0);
    opacity: 0.4;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.btn {
  @apply inline-flex items-center justify-center gap-2 font-medium
       transition-all duration-fast ease-out
       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
       disabled:opacity-50 disabled:pointer-events-none
       select-none relative overflow-hidden;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-weight: var(--font-medium);
  white-space: nowrap;
  position: relative;
}

.btn-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-xs { padding: 0.375rem 0.75rem; font-size: var(--text-xs); border-radius: var(--radius-md); }
.btn-sm { padding: 0.5rem 1rem; font-size: var(--text-xs); border-radius: var(--radius-md); }
.btn-md { padding: 0.625rem 1.25rem; font-size: var(--text-sm); border-radius: var(--radius-xl); }
.btn-lg { padding: 0.875rem 1.5rem; font-size: var(--text-base); border-radius: var(--radius-xl); }
.btn-xl { padding: 1rem 2rem; font-size: var(--text-lg); border-radius: var(--radius-xl); }
.btn-icon { width: 40px; height: 40px; padding: 0; border-radius: var(--radius-xl); }

.btn-primary {
  @apply btn;
  background: linear-gradient(135deg, var(--brand), var(--brand-hover));
  color: var(--brand-fg);
  box-shadow: var(--shadow-brand-sm);
  border: none;
}
.btn-primary:hover:not(:disabled):not(.loading) {
  filter: brightness(1.05);
  box-shadow: var(--shadow-brand-md);
  transform: translateY(-1px);
}
.btn-primary:active:not(:disabled):not(.loading) { transform: scale(0.97); }
.btn-primary:focus-visible {
  @apply ring-2 ring-offset-2;
  --tw-ring-color: var(--brand);
  --tw-ring-offset-color: var(--ring-offset);
}

.btn-secondary {
  @apply btn;
  background-color: var(--bg-subtle);
  color: var(--fg);
  border: 1px solid var(--card-border);
}
.btn-secondary:hover:not(:disabled):not(.loading) {
  background-color: var(--bg-hover);
  border-color: var(--card-border);
}

.btn-outline {
  @apply btn border;
  border-color: var(--card-border);
  background-color: transparent;
  color: var(--fg);
}
.btn-outline:hover:not(:disabled):not(.loading) {
  background-color: var(--bg-subtle);
  border-color: var(--fg-muted);
}

.btn-ghost {
  @apply btn;
  background-color: transparent;
  color: var(--fg);
}
.btn-ghost:hover:not(:disabled):not(.loading) {
  background-color: var(--bg-subtle);
}

.btn-link-base {
  @apply btn;
  background: transparent;
  border: none;
  padding: 0.375rem 0.75rem;
}
.btn-link {
  color: var(--brand);
}
.btn-link:hover:not(:disabled):not(.loading) {
  text-decoration: underline;
}
.btn-link-danger {
  color: var(--destructive);
}
.btn-link-danger:hover:not(:disabled):not(.loading) {
  text-decoration: underline;
}

.btn-danger {
  @apply btn;
  background: linear-gradient(135deg, var(--destructive), #b91c1c);
  color: var(--destructive-fg);
  box-shadow: 0 2px 8px -2px rgba(220, 38, 38, 0.25);
  border: none;
}
.btn-danger:hover:not(:disabled):not(.loading) {
  filter: brightness(1.05);
  box-shadow: 0 8px 24px -4px rgba(220, 38, 38, 0.3);
}

.btn-success {
  @apply btn;
  background: linear-gradient(135deg, var(--success), #15803d);
  color: var(--success-fg);
  box-shadow: 0 2px 8px -2px rgba(22, 163, 74, 0.25);
  border: none;
}
.btn-success:hover:not(:disabled):not(.loading) {
  filter: brightness(1.05);
  box-shadow: 0 8px 24px -4px rgba(22, 163, 74, 0.3);
}

.btn-icon {
  @apply btn;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-xl);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-pressed:active:not(:disabled):not(.loading) {
  transform: scale(0.96);
  transition: transform 0.04s ease;
}

.btn-loading .btn-content {
  opacity: 0.7;
}

.btn-ripple {
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.2;
  pointer-events: none;
  transform: translate(-50%, -50%);
  animation: ripple-animation 0.6s ease-out forwards;
}

@keyframes ripple-animation {
  0% {
    width: 0;
    height: 0;
    opacity: 0.3;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-ripple { animation: none !important; }
  .btn-pressed:active { transform: none !important; }
  .btn-primary:hover { transform: none !important; }
}

.btn-primary:not(:disabled):not(.loading):hover {
  filter: brightness(1.05);
  box-shadow: var(--shadow-brand-md);
  transform: translateY(-1px);
}

.btn-primary:not(:disabled):not(.loading):active {
  transform: scale(0.97);
  transition: transform 0.04s ease;
}

.btn:focus-visible {
  @apply ring-2 ring-offset-2;
  --tw-ring-color: var(--brand);
  --tw-ring-offset-color: var(--ring-offset);
}
</style>