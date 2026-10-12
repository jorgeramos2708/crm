<!-- Sidebar (Premium): navegación lateral con animaciones, estados activos, badges, collapsible
  Características:
  - Animaciones fluidas de colapso/expansión con spring physics
  - Estados activos con indicadores visuales premium
  - Badges de notificación con animación pulse
  - Tooltips en modo colapsado
  - Animaciones de entrada escalonadas (stagger)
  - Accesibilidad completa (ARIA, keyboard navigation)
  - Brand header con logo/avatar animado
  - User menu con dropdown premium -->
<template>
  <aside
    v-if="authStore.isAuthenticated"
    class="sidebar"
    :class="[
      collapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
      mobileOpen ? 'sidebar-mobile-open' : '',
    ]"
    :style="{ '--sidebar-width': collapsed ? '72px' : '280px' }"
    role="navigation"
    aria-label="Navegación principal"
  >
    <!-- Brand Header -->
    <header class="sidebar-header">
      <div class="brand-container">
        <div
          v-if="marca.logo"
          :class="['brand-logo', { 'brand-logo-collapsed': collapsed }]"
        >
          <img :src="marca.logo" alt="" class="logo-img" />
          <span v-if="!collapsed" class="brand-text">
            <span class="brand-name">{{ marca.nombre }}</span>
            <span class="brand-tagline">Workspace</span>
          </span>
        </div>
        <div
          v-else
          :class="['brand-logo-fallback', { 'brand-logo-fallback-collapsed': collapsed }]"
        >
          <div class="logo-avatar">
            {{ (marca.nombre || "C").charAt(0).toUpperCase() }}
          </div>
          <span v-if="!collapsed" class="brand-text">
            <span class="brand-name">{{ marca.nombre }}</span>
            <span class="brand-tagline">Workspace</span>
          </span>
        </div>

        <button
          @click="toggleCollapse"
          class="collapse-toggle"
          :aria-label="collapsed ? 'Expandir menú' : 'Contraer menú'"
          :aria-expanded="!collapsed"
          title="Contraer/Expandir"
        >
          <svg
            class="toggle-icon"
            :class="{ 'rotated': collapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Navigation -->
    <nav
      class="sidebar-nav"
      role="navigation"
      aria-label="Navegación principal"
      :style="{ '--nav-transition-delay': '0ms' }"
    >
      <!-- Dashboard link -->
      <router-link
        to="/"
        :title="collapsed ? 'Resumen' : ''"
        class="nav-link"
        :class="[
          isActive('/') ? 'nav-link-active' : '',
          collapsed ? 'nav-link-collapsed' : '',
        ]"
      >
        <Icon name="layout-dashboard" class="nav-icon" />
        <span v-if="!collapsed" class="nav-label">Resumen</span>
        <span v-if="collapsed" class="nav-tooltip">Resumen</span>
      </router-link>

      <!-- Navigation Groups -->
      <TransitionGroup name="accordion" tag="div" class="sidebar-groups">
        <div
          v-for="group in visibleGroups"
          :key="group.label"
          class="nav-group"
          :style="{ '--stagger-index': groupIndex }"
        >
          <button
            @click="toggleGroup(group.label)"
            class="nav-group-toggle"
            :class="{ 'nav-group-open': openGroups.includes(group.label) }"
            :aria-expanded="openGroups.includes(group.label)"
            :aria-controls="`nav-group-${group.label}`"
          >
            <Icon :name="group.icon" class="nav-group-icon" />
            <span v-if="!collapsed" class="nav-group-label">{{ group.label }}</span>
            <svg
              class="nav-group-chevron"
              :class="{ 'rotated': openGroups.includes(group.label) }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <ul
            :id="`nav-group-${group.label}`"
            class="nav-group-items"
            :class="{ 'nav-group-items-open': openGroups.includes(group.label) || collapsed }"
            role="list"
          >
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="[
                isActive(item.to) ? 'nav-item-active' : '',
                collapsed ? 'nav-item-collapsed' : '',
              ]"
              :title="collapsed ? item.desc : undefined"
            >
              <Icon :name="item.icon" class="nav-item-icon" />
              <span v-if="!collapsed" class="nav-item-content">
                <span class="nav-item-label">{{ item.name }}</span>
                <span class="nav-item-desc">{{ item.desc }}</span>
              </span>
              <span v-if="collapsed" class="nav-tooltip">{{ item.name }}</span>

              <!-- Notification badge -->
              <span
                v-if="item.badge"
                class="nav-badge"
                :class="item.badgeColor"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </ul>
        </div>
      </TransitionGroup>

      <!-- Bottom actions -->
      <div v-if="!collapsed" class="nav-bottom">
        <router-link
          to="/settings"
          class="nav-item nav-item-settings"
          :class="{ 'nav-item-active': isActive('/settings') }"
        >
          <Icon name="settings" class="nav-item-icon" />
          <span class="nav-item-label">Configuración</span>
        </router-link>

        <div class="nav-divider" />

        <div class="user-menu">
          <button
            @click="toggleUserMenu"
            class="user-menu-trigger"
            :aria-expanded="userMenuOpen"
            aria-haspopup="true"
          >
            <div class="user-avatar">
              <img
                v-if="marca.logo"
                :src="marca.logo"
                alt=""
              />
              <span v-else>{{ (authStore.user?.name || "U").charAt(0).toUpperCase() }}</span>
            </div>
            <div class="user-info">
              <span class="user-name">{{ authStore.user?.name }}</span>
              <span class="user-role">{{ formatRole(authStore.user?.role) }}</span>
            </div>
            <svg
              class="user-chevron"
              :class="{ 'rotated': userMenuOpen }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <Teleport to="body">
            <Transition name="fade-scale">
              <div
                v-if="userMenuOpen"
                class="user-dropdown"
                role="menu"
              >
                <router-link
                  to="/settings"
                  class="dropdown-item"
                  role="menuitem"
                  @click="userMenuOpen = false"
                >
                  <Icon name="settings" class="dropdown-icon" />
                  Configuración
                </router-link>
                <div class="dropdown-divider" />
                <button
                  class="dropdown-item dropdown-danger"
                  role="menuitem"
                  @click="logout"
                >
                  <Icon name="log-out" class="dropdown-icon" />
                  Cerrar sesión
                </button>
              </div>
            </Transition>
          </Teleport>
        </div>
      </div>

      <!-- Mobile bottom bar (collapsed mode) -->
      <div v-if="collapsed" class="sidebar-mobile-bottom">
        <router-link
          to="/settings"
          class="mobile-bottom-item"
          :class="{ active: isActive('/settings') }"
          @click="mobileOpen = false"
        >
          <Icon name="settings" class="mobile-bottom-icon" />
          <span class="mobile-bottom-label">Config</span>
        </router-link>
        <button
          class="mobile-bottom-item"
          @click="logout"
        >
          <Icon name="log-out" class="mobile-bottom-icon" />
          <span class="mobile-bottom-label">Salir</span>
        </button>
      </div>
    </nav>

    <!-- Overlay for mobile -->
    <div
      v-if="mobileOpen"
      class="sidebar-overlay"
      @click="mobileOpen = false"
      aria-hidden="true"
    />
  </aside>

  <!-- Mobile hamburger button -->
  <button
    v-if="authStore.isAuthenticated"
    @click="mobileOpen = true"
    class="mobile-menu-btn"
    aria-label="Abrir menú"
    aria-expanded="mobileOpen"
    aria-controls="sidebar"
  >
    <svg
      :class="{ 'open': mobileOpen }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path :d="mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { marca, loadMarca } from "@/utils/marca";
import Icon from "./Icon.vue";
import Btn from "./Btn.vue";
import { Tooltip } from "reka-ui";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const mobileOpen = ref(false);
const collapsed = ref(false);
const paletteAbierta = ref(false);
const userMenuOpen = ref(false);
const openGroups = ref(["Ventas"]);

try {
  collapsed.value = localStorage.getItem("crm-sidebar") === "collapsed";
} catch {}

const themeProvider = inject("theme", {
  theme: ref("light"),
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: () => false,
});

const theme = themeProvider.theme;
const toggleTheme = themeProvider.toggleTheme;
const setTheme = themeProvider.setTheme;
const isDark = themeProvider.isDark;

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem("crm-sidebar", collapsed.value ? "collapsed" : "expanded");
  } catch {}
};

const toggleGroup = (label) => {
  openGroups.value = openGroups.value.includes(label)
    ? openGroups.value.filter((l) => l !== label)
    : [...openGroups.value, label];
  try {
    localStorage.setItem("crm-nav-open", JSON.stringify(openGroups.value));
  } catch {}
};

const isActive = (path) => route.path === path;

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};

const logout = async () => {
  await authStore.logout();
  router.push("/login");
};

const formatRole = (role) => {
  const roles = {
    admin: "Administrador",
    manager: "Gerente",
    sales: "Ventas",
    marketing: "Marketing",
    support: "Soporte",
  };
  return roles[role] || role;
};

const puedeVer = (mod) => {
  if (!mod) return true;
  if (authStore.user?.role === "admin") return true;
  return !!authStore.user?.permisos?.[mod]?.r;
};

const visibleGroups = computed(() =>
  navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => puedeVer(i.mod)) }))
    .filter((g) => g.items.length)
);

const groupIndex = computed(() => {
  return visibleGroups.value.findIndex((g) => g.label === "Ventas");
});

const pageTitle = computed(() => {
  const titles = {
    "/": "Resumen",
    "/pipeline": "Pipeline",
    "/contactos": "Contactos",
    "/empresas": "Empresas",
    "/correos": "Correos",
    "/calendario": "Calendario",
    "/campañas": "Campañas",
    "/plantillas": "Plantillas",
    "/listas": "Listas",
    "/tareas": "Tareas",
    "/negocios": "Negocios",
    "/presupuestos": "Presupuestos",
    "/productos": "Productos",
    "/automatizaciones": "Automatizaciones",
    "/actividades": "Actividades",
    "/reportes": "Reportes",
    "/settings": "Configuración",
    "/login": "Iniciar sesión",
  };
  return titles[route.path] || "CRM";
});

const navGroups = [
  {
    label: "Ventas",
    icon: "trending-up",
    items: [
      { mod: "contactos", to: "/contactos", name: "Contactos", desc: "Personas y sus datos", icon: "users" },
      { mod: "empresas", to: "/empresas", name: "Empresas", desc: "Cuentas y contactos vinculados", icon: "building-2" },
      { mod: "oportunidades", to: "/pipeline", name: "Pipeline", desc: "El flujo visual de tus ventas", icon: "git-branch" },
      { mod: "oportunidades", to: "/negocios", name: "Negocios", desc: "El listado de transacciones", icon: "briefcase" },
      { mod: "presupuestos", to: "/presupuestos", name: "Presupuestos", desc: "Cotizaciones con folio y totales", icon: "file-text" },
      { mod: "productos", to: "/productos", name: "Productos", desc: "Catálogo con precios", icon: "package" },
    ],
  },
  {
    label: "Marketing y Mensajería",
    icon: "mail",
    items: [
      { mod: "correos", to: "/correos", name: "Correos", desc: "Bandeja de Outlook y Gmail", icon: "mail" },
      { mod: "campañas", to: "/campañas", name: "Campañas", desc: "Email masivo segmentado", icon: "send" },
      { mod: "plantillas", to: "/plantillas", name: "Plantillas", desc: "Plantillas reutilizables", icon: "layout-template" },
      { mod: "listas", to: "/listas", name: "Listas", desc: "Segmentos de contactos", icon: "list" },
    ],
  },
  {
    label: "Agenda y Tareas",
    icon: "calendar",
    items: [
      { mod: "calendario", to: "/calendario", name: "Calendario", desc: "Eventos de Outlook y Google", icon: "calendar" },
      { mod: "tareas", to: "/tareas", name: "Tareas", desc: "Pendientes vinculados", icon: "check-square" },
      { mod: "actividades", to: "/actividades", name: "Actividades", desc: "Historial de acciones", icon: "activity" },
      { mod: "reuniones", to: "/reuniones", name: "Reuniones", desc: "Programador de citas", icon: "calendar-plus" },
    ],
  },
  {
    label: "Operaciones y Reportes",
    icon: "bar-chart-2",
    items: [
      { mod: "automatizaciones", to: "/automatizaciones", name: "Automatizaciones", desc: "Reglas automáticas", icon: "zap" },
      { mod: "reportes", to: "/reportes", name: "Reportes", desc: "Embudo y métricas", icon: "bar-chart-2" },
    ],
  },
];

// Load marca on mount
onMounted(async () => {
  await loadMarca();
});

// Keyboard shortcuts
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

function handleKeydown(e) {
  // Cmd/Ctrl + K for command palette
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    paletteAbierta.value = true;
  }
  // Escape to close mobile menu
  if (e.key === "Escape") {
    mobileOpen.value = false;
    userMenuOpen.value = false;
  }
  // Cmd/Ctrl + B to toggle sidebar
  if ((e.metaKey || e.ctrlKey) && e.key === "b") {
    e.preventDefault();
    toggleCollapse();
  }
}

// Watch for outside clicks on user menu
watch(userMenuOpen, (open) => {
  if (open) {
    document.addEventListener("click", handleOutsideClick);
  } else {
    document.removeEventListener("click", handleOutsideClick);
  }
});

function handleOutsideClick(e) {
  const dropdown = document.querySelector(".user-dropdown");
  const trigger = document.querySelector(".user-menu-trigger");
  if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
    userMenuOpen.value = false;
  }
}
</script>

<style scoped>
/* ============================================================
   SIDEBAR CONTAINER
   ============================================================ */
.sidebar {
  @apply fixed inset-y-0 left-0 z-50 flex flex-col
         bg-[var(--card)] border-r transition-all duration-300 ease-spring;
  border-color: var(--card-border);
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  max-width: var(--sidebar-width);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed {
  width: 72px;
  min-width: 72px;
  max-width: 72px;
}

.sidebar-expanded {
  width: 280px;
  min-width: 280px;
  max-width: 280px;
}

.sidebar-mobile-open {
  @apply fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw];
  box-shadow: var(--shadow-xl);
  animation: slide-in-left var(--duration-normal) var(--ease-out);
}

.sidebar-overlay {
  @apply fixed inset-0 bg-black/50 z-[55] lg:hidden;
  animation: fade-in var(--duration-fast) var(--ease-out);
}

/* ============================================================
   BRAND HEADER
   ============================================================ */
.sidebar-header {
  @apply flex items-center justify-between h-16 px-4 border-b
         transition-all duration-300 ease-out;
  border-color: var(--card-border);
  background: linear-gradient(180deg, var(--card) 0%, var(--panel) 100%);
}

.brand-container {
  @apply flex items-center gap-3 min-w-0 flex-1;
}

.brand-logo,
.brand-logo-fallback {
  @apply flex items-center gap-3 transition-all duration-300 ease-out;
}

.brand-logo-collapsed,
.brand-logo-fallback-collapsed {
  @apply justify-center gap-0;
}

.logo-img,
.logo-avatar {
  @apply w-9 h-9 flex-shrink-0 rounded-xl transition-all duration-300 ease-out;
}

.logo-img {
  @apply object-cover;
}

.logo-avatar {
  @apply flex items-center justify-center rounded-xl
         bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)]
         text-[var(--brand-fg)] font-bold text-base;
}

.brand-text {
  @apply min-w-0 overflow-hidden transition-all duration-300 ease-out;
  white-space: nowrap;
}

.brand-name {
  @apply block truncate text-[15px] font-semibold leading-5 text-[var(--fg)];
}

.brand-tagline {
  @apply block truncate text-xs text-[var(--fg-muted)];
}

/* Collapse toggle */
.collapse-toggle {
  @apply flex items-center justify-center w-8 h-8 rounded-xl
       text-[var(--fg-muted)] hover:text-[var(--fg)]
       hover:bg-[var(--bg-subtle)] transition-colors duration-fast ease-out
       focus-ring focus-ring-offset-2;
  flex-shrink: 0;
}

.toggle-icon {
  @apply h-5 w-5 transition-transform duration-300 ease-spring;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
.sidebar-nav {
  @apply flex-1 overflow-y-auto px-3 pb-3 pt-2
         transition-padding duration-300 ease-out;
  scrollbar-width: thin;
  scrollbar-color: var(--fg-subtle) transparent;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}
.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--fg-subtle);
  border-radius: var(--radius-full);
}

/* Nav Link */
.nav-link {
  @apply mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
         transition-all duration-150 ease-out
         focus-ring focus-ring-offset-2;
}

.nav-link-collapsed {
  @apply justify-center px-0;
}

.nav-label {
  @apply truncate;
}

.nav-tooltip {
  @apply absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1.5
         text-xs font-medium text-[var(--primary-fg)] rounded-lg
         whitespace-nowrap opacity-0 invisible
         group-hover:opacity-100 group-hover:visible
         transition-opacity duration-fast ease-out transition-transform duration-fast ease-spring;
  background: var(--fg);
  transform: translateX(8px);
  z-index: var(--z-tooltip);
}

.nav-link:hover .nav-tooltip {
  transform: translateX(0);
}

.nav-link-active {
  @apply bg-[var(--brand)] text-[var(--brand-fg)] shadow-brand-sm;
}

.nav-link-active .nav-icon,
.nav-link-active .nav-label,
.nav-link-active .nav-tooltip {
  color: var(--brand-fg) !important;
}

.nav-icon {
  @apply h-5 w-5 flex-shrink-0 transition-colors duration-fast ease-out;
}

.nav-link:not(.nav-link-active) .nav-icon {
  color: var(--fg-muted);
}

.nav-link:hover .nav-icon,
.nav-link:hover .nav-label {
  color: var(--fg);
}

/* Nav Groups */
.sidebar-groups {
  @apply mt-2;
}

.nav-group {
  @apply mt-2 overflow-hidden;
  animation: slide-down var(--duration-normal) var(--ease-out);
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
  animation-fill-mode: both;
}

.nav-group-toggle {
  @apply flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm
         text-[var(--fg-muted)] hover:text-[var(--fg)]
         hover:bg-[var(--bg-subtle)] transition-colors duration-fast ease-out
         focus-ring focus-ring-offset-2;
}

.nav-group-label {
  @apply flex-1 text-left font-medium truncate;
}

.nav-group-icon {
  @apply h-5 w-5 flex-shrink-0 transition-transform duration-fast ease-spring;
}

.nav-group-chevron {
  @apply h-4 w-4 flex-shrink-0 text-[var(--fg-muted)]
         transition-transform duration-fast ease-spring;
}

.nav-group-open .nav-group-chevron {
  transform: rotate(180deg);
}

.nav-group-items {
  @apply mt-1 space-y-0.5 overflow-hidden transition-all duration-300 ease-out;
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.nav-group-items-open {
  max-height: 500px;
  opacity: 1;
  pointer-events: auto;
  padding-top: 0.25rem;
}

/* Nav Items */
.nav-item {
  @apply flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm
         text-[var(--fg-muted)] hover:text-[var(--fg)]
         hover:bg-[var(--bg-subtle)] transition-all duration-150 ease-out
         focus-ring focus-ring-offset-2 press-scale-sm;
}

.nav-item-collapsed {
  @apply justify-center px-0;
}

.nav-item-content {
  @apply flex flex-col min-w-0 flex-1;
}

.nav-item-label {
  @apply block truncate font-medium;
}

.nav-item-desc {
  @apply block truncate text-xs text-[var(--fg-muted)];
}

.nav-item-icon {
  @apply h-5 w-5 flex-shrink-0 transition-colors duration-fast ease-out;
}

.nav-item:hover .nav-item-icon,
.nav-item:hover .nav-item-label {
  color: var(--fg);
}

.nav-item-active {
  @apply bg-[var(--brand)] text-[var(--brand-fg)] shadow-brand-sm;
}

.nav-item-active .nav-item-icon,
.nav-item-active .nav-item-label,
.nav-item-active .nav-item-desc,
.nav-item-active .nav-tooltip {
  color: var(--brand-fg) !important;
}

.nav-badge {
  @apply ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full;
  animation: pulse-soft 2s ease-in-out infinite;
}

.nav-badge-success {
  @apply bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400;
}
.nav-badge-warning {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
.nav-badge-destructive {
  @apply bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400;
}
.nav-badge-info {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400;
}
.nav-badge-primary {
  @apply bg-[var(--brand)] text-[var(--brand-fg)];
}

/* Bottom section */
.nav-bottom {
  @apply mt-auto pt-3 border-t;
  border-color: var(--card-border);
}

.nav-item-settings {
  @apply text-[var(--fg-muted)] hover:text-[var(--fg)];
}

.nav-divider {
  @apply my-3 h-px bg-[var(--card-border)];
}

/* User Menu */
.user-menu {
  @apply relative;
}

.user-menu-trigger {
  @apply flex w-full items-center gap-3 rounded-xl px-3 py-2.5
         text-[var(--fg-muted)] hover:text-[var(--fg)]
         hover:bg-[var(--bg-subtle)] transition-colors duration-fast ease-out
         focus-ring focus-ring-offset-2 press-scale-sm;
}

.user-avatar {
  @apply flex h-9 w-9 items-center justify-center rounded-xl
         bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)]
         text-[var(--brand-fg)] font-semibold;
}

.user-avatar img {
  @apply h-9 w-9 rounded-xl object-cover;
}

.user-info {
  @apply flex-1 min-w-0 flex flex-col;
}

.user-name {
  @apply block truncate text-sm font-medium text-[var(--fg)];
}

.user-role {
  @apply block truncate text-xs text-[var(--fg-muted)];
}

.user-chevron {
  @apply h-4 w-4 flex-shrink-0 text-[var(--fg-muted)]
         transition-transform duration-fast ease-spring;
}

.user-chevron.rotated {
  transform: rotate(180deg);
}

/* User Dropdown */
.user-dropdown {
  @apply absolute right-0 top-full mt-2 w-48 rounded-xl
         bg-[var(--card)] border shadow-xl
         dark:bg-zinc-800;
  border-color: var(--card-border);
  animation: scale-in var(--duration-fast) var(--ease-spring);
  z-index: var(--z-dropdown);
}

.dropdown-item {
  @apply flex w-full items-center gap-2 px-3 py-2 text-sm
         text-[var(--fg)] rounded-lg transition-colors duration-fast ease-out
         focus-ring;
}

.dropdown-item:hover {
  background: var(--bg-subtle);
}

.dropdown-icon {
  @apply h-4 w-4;
}

.dropdown-danger {
  color: var(--destructive);
}

.dropdown-danger:hover {
  background: var(--destructive-bg);
  color: var(--destructive);
}

.dropdown-divider {
  @apply h-px my-1 bg-[var(--card-border)];
}

/* Mobile bottom bar */
.sidebar-mobile-bottom {
  @apply flex border-t p-2;
  border-color: var(--card-border);
}

.mobile-bottom-item {
  @apply flex-1 flex flex-col items-center gap-1 px-2 py-2
         rounded-xl text-xs font-medium text-[var(--fg-muted)]
         hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]
         transition-colors duration-fast ease-out;
}

.mobile-bottom-item.active {
  color: var(--brand);
  background: color-mix(in srgb, var(--brand) 10%, transparent);
}

.mobile-bottom-icon {
  @apply h-5 w-5;
}

.mobile-bottom-label {
  @apply hidden;
}

/* Mobile menu button */
.mobile-menu-btn {
  @apply lg:hidden fixed left-4 top-4 z-50 flex items-center justify-center
         h-12 w-12 rounded-xl border bg-white dark:bg-zinc-800 p-2 shadow-sm
         text-[var(--fg)] transition-colors duration-fast ease-out focus-ring;
  border-color: var(--card-border);
}

.mobile-menu-btn svg {
  @apply h-6 w-6 transition-transform duration-fast ease-spring;
}

.mobile-menu-btn.open svg {
  transform: rotate(90deg);
}

/* ============================================================
   ANIMATIONS
   ============================================================ */

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-out-left {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Stagger animation for nav groups */
@media (prefers-reduced-motion: no-preference) {
  .nav-group:nth-child(1) { animation-delay: 50ms; }
  .nav-group:nth-child(2) { animation-delay: 100ms; }
  .nav-group:nth-child(3) { animation-delay: 150ms; }
  .nav-group:nth-child(4) { animation-delay: 200ms; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar *,
  .sidebar-overlay,
  .nav-group,
  .user-dropdown,
  .nav-badge {
    animation: none !important;
    transition: none !important;
  }
}

/* Enter/leave animations for TransitionGroup */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease-out;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease-out;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}
</style>