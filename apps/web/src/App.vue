<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex text-zinc-900 dark:text-zinc-100">
    <!-- Sidebar escritorio -->
    <aside v-if="authStore.isAuthenticated" class="hidden lg:flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transition-all duration-200" :class="collapsed ? 'w-[76px]' : 'w-[272px]'">
      <div class="border-b border-zinc-200 dark:border-zinc-700" :class="collapsed ? 'px-2 py-3' : 'px-4 h-16'">
        <div class="flex items-center gap-3" :class="collapsed ? 'flex-col gap-2' : 'h-full'">
          <img v-if="marca.logo" :src="marca.logo" alt="logo" class="h-9 w-9 flex-shrink-0 rounded-xl object-cover" />
          <span v-else class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-base font-bold">{{ (marca.nombre || 'C').charAt(0).toUpperCase() }}</span>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-[15px] font-semibold leading-5">{{ marca.nombre }}</p>
            <p class="truncate text-xs text-zinc-500">Espacio de trabajo</p>
          </div>
          <button @click="setCollapsed(!collapsed)" :title="collapsed ? 'Expandir menú' : 'Contraer menú'" class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'" /></svg>
          </button>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-3 pt-2">
        <router-link
          to="/"
          :title="collapsed ? 'Resumen' : ''"
          class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
          :class="[
            isActive('/')
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
            collapsed ? 'justify-center px-0' : ''
          ]"
        >
          <Icon name="resumen" class="h-5 w-5" />
          <span v-if="!collapsed">Resumen</span>
        </router-link>

        <template v-for="group in visGroups" :key="group.label">
          <button
            v-if="!collapsed"
            @click="toggleGroup(group.label)"
            class="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
            :class="groupActive(group) ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            <Icon :name="group.icon" class="h-5 w-5" />
            <span class="flex-1 text-left">{{ group.label }}</span>
            <svg class="h-4 w-4 transition-transform" :class="openGroups.includes(group.label) ? '' : '-rotate-90'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-if="collapsed" class="mx-3 mb-1 mt-3 border-t border-zinc-200 dark:border-zinc-700"></div>
          <div v-show="collapsed || openGroups.includes(group.label)" class="overflow-hidden">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :title="item.desc || item.name"
              class="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
                collapsed ? 'justify-center px-0' : 'ml-4'
              ]"
            >
              <Icon :name="item.icon" class="h-5 w-5" />
              <span v-if="!collapsed">{{ item.name }}</span>
            </router-link>
          </div>
        </template>

        <div class="mx-3 mb-1 mt-3 border-t border-zinc-200 dark:border-zinc-700"></div>
        <router-link
          to="/settings"
          :title="collapsed ? 'Configuración' : ''"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
          :class="[
            isActive('/settings')
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
            collapsed ? 'justify-center px-0' : ''
          ]"
        >
          <Icon name="ajustes" class="h-5 w-5" />
          <span v-if="!collapsed">Configuración</span>
        </router-link>
      </nav>
    </aside>

    <!-- Botón menú móvil -->
    <button v-if="authStore.isAuthenticated" @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden fixed left-4 top-4 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-sm">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" /></svg>
    </button>

    <!-- Panel móvil -->
    <div v-if="mobileMenuOpen && authStore.isAuthenticated" class="lg:hidden fixed inset-0 z-40 bg-black/50" @click="mobileMenuOpen = false"></div>
    <aside v-if="mobileMenuOpen && authStore.isAuthenticated" class="lg:hidden fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-zinc-100 dark:bg-zinc-800">
      <div class="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 px-4 h-16">
        <img v-if="marca.logo" :src="marca.logo" alt="logo" class="h-9 w-9 rounded-xl object-cover" />
        <span v-else class="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-base font-bold">{{ (marca.nombre || 'C').charAt(0).toUpperCase() }}</span>
        <p class="flex-1 text-[15px] font-semibold">{{ marca.nombre }}</p>
        <button @click="mobileMenuOpen = false" class="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto p-3">
        <router-link to="/" @click="mobileMenuOpen = false" class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><Icon name="resumen" class="h-5 w-5" /> Resumen</router-link>
        <template v-for="group in visGroups" :key="group.label">
          <button @click="toggleGroup(group.label)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            <Icon :name="group.icon" class="h-5 w-5" />
            <span class="flex-1 text-left font-medium">{{ group.label }}</span>
            <svg class="h-4 w-4 transition-transform" :class="openGroups.includes(group.label) ? '' : '-rotate-90'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-show="openGroups.includes(group.label)">
            <router-link v-for="item in group.items" :key="item.to" :to="item.to" :title="item.desc || item.name" @click="mobileMenuOpen = false" class="ml-4 mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><Icon :name="item.icon" class="h-5 w-5" /> {{ item.name }}</router-link>
          </div>
        </template>
        <div class="mx-3 mb-1 mt-2 border-t border-zinc-200 dark:border-zinc-700"></div>
        <router-link to="/settings" @click="mobileMenuOpen = false" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><Icon name="ajustes" class="h-5 w-5" />Configuración</router-link>
      </nav>
      <div class="border-t border-zinc-200 dark:border-zinc-700 p-3">
        <button @click="logout" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Cerrar sesión</button>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="min-w-0 flex-1">
      <header v-if="authStore.isAuthenticated" class="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 pl-14 lg:pl-6">
          <div class="min-w-0">
            <h1 class="truncate text-lg font-semibold">{{ pageTitle }}</h1>
            <p class="hidden text-xs text-zinc-500 sm:block">{{ fechaHoy }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="toggleTheme" :title="theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100">
              <svg v-if="theme === 'dark'" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            </button>
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{{ initial }}</span>
            <span class="hidden text-left sm:block">
              <span class="block text-sm font-medium leading-5">{{ authStore.user?.name || 'Usuario' }}</span>
              <span class="block max-w-[180px] truncate text-xs text-zinc-500">{{ authStore.user?.email || '' }}</span>
            </span>
            <button @click="logout" title="Cerrar sesión" class="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-red-600">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <ConfirmDialog />
      <Toasts />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { marca, loadMarca } from './utils/marca'
import ConfirmDialog from './components/ConfirmDialog.vue'
import Toasts from './components/Toasts.vue'
import Icon from './components/Icon.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const collapsed = ref(false)
try {
  collapsed.value = localStorage.getItem('crm-sidebar') === 'collapsed'
} catch { /* noop */ }

const theme = ref('light')
try {
  const saved = localStorage.getItem('crm-theme')
  theme.value = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
} catch { theme.value = 'light' }

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  try { localStorage.setItem('crm-theme', theme.value) } catch { /* noop */ }
}

const navGroups = [
  {
    label: 'Ventas',
    icon: 'ventas',
    items: [
      { mod: 'contactos', to: '/contactos', name: 'Contactos', desc: 'Personas y sus datos', icon: 'contactos' },
      { mod: 'empresas', to: '/empresas', name: 'Empresas', desc: 'Cuentas y contactos vinculados', icon: 'empresas' },
      { mod: 'oportunidades', to: '/pipeline', name: 'Pipeline', desc: 'El flujo visual de tus ventas', icon: 'pipeline' },
      { mod: 'oportunidades', to: '/negocios', name: 'Negocios', desc: 'El listado de transacciones', icon: 'negocios' },
      { mod: 'presupuestos', to: '/presupuestos', name: 'Presupuestos', desc: 'Cotizaciones con folio y totales', icon: 'presupuestos' },
      { mod: 'productos', to: '/productos', name: 'Productos', desc: 'Catálogo con precios', icon: 'productos' },
    ],
  },
  {
    label: 'Marketing y Mensajería',
    icon: 'marketing',
    items: [
      { mod: 'correos', to: '/correos', name: 'Correos', desc: 'Bandeja de Outlook y Gmail', icon: 'correos' },
      { mod: 'campañas', to: '/campañas', name: 'Campañas', desc: 'Email masivo segmentado', icon: 'campanas' },
      { mod: 'plantillas', to: '/plantillas', name: 'Plantillas', desc: 'Plantillas reutilizables', icon: 'plantillas' },
      { mod: 'listas', to: '/listas', name: 'Listas', desc: 'Segmentos de contactos', icon: 'listas' },
    ],
  },
  {
    label: 'Agenda y Tareas',
    icon: 'agenda',
    items: [
      { mod: 'calendario', to: '/calendario', name: 'Calendario', desc: 'Eventos de Outlook y Google', icon: 'calendario' },
      { mod: 'tareas', to: '/tareas', name: 'Tareas', desc: 'Pendientes vinculados', icon: 'tareas' },
      { mod: 'actividades', to: '/actividades', name: 'Actividades', desc: 'Historial de acciones', icon: 'actividades' },
    ],
  },
  {
    label: 'Operaciones y Reportes',
    icon: 'operaciones',
    items: [
      { mod: 'automatizaciones', to: '/automatizaciones', name: 'Automatizaciones', desc: 'Reglas automáticas', icon: 'automatizaciones' },
      { mod: 'reportes', to: '/reportes', name: 'Reportes', desc: 'Embudo y métricas', icon: 'reportes' },
    ],
  },
]

const openGroups = ref(['Ventas'])
try {
  const saved = JSON.parse(localStorage.getItem('crm-nav-open') || 'null')
  if (Array.isArray(saved) && saved.length) openGroups.value = saved
} catch { /* noop */ }

const toggleGroup = (label) => {
  openGroups.value = openGroups.value.includes(label)
    ? openGroups.value.filter(l => l !== label)
    : [...openGroups.value, label]
  try { localStorage.setItem('crm-nav-open', JSON.stringify(openGroups.value)) } catch { /* noop */ }
}

const isActive = (path) => route.path === path

const groupActive = (group) => group.items.some(i => isActive(i.to))

const puedeVer = (mod) => {
  if (!mod) return true
  if (authStore.user?.role === 'admin') return true
  return !!authStore.user?.permisos?.[mod]?.r
}

const visGroups = computed(() => navGroups
  .map(g => ({ ...g, items: g.items.filter(i => puedeVer(i.mod)) }))
  .filter(g => g.items.length))

const initial = computed(() => (authStore.user?.name || 'U').trim().charAt(0).toUpperCase())

const fechaHoy = computed(() => {
  const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const pageTitle = computed(() => {
  const titles = {
    '/': 'Resumen',
    '/pipeline': 'Pipeline',
    '/contactos': 'Contactos',
    '/empresas': 'Empresas',
    '/correos': 'Correos',
    '/calendario': 'Calendario',
    '/campañas': 'Campañas',
    '/plantillas': 'Plantillas',
    '/listas': 'Listas',
    '/tareas': 'Tareas',
    '/negocios': 'Negocios',
    '/presupuestos': 'Presupuestos',
    '/productos': 'Productos',
    '/automatizaciones': 'Automatizaciones',
    '/actividades': 'Actividades',
    '/reportes': 'Reportes',
    '/settings': 'Configuración',
    '/login': 'Iniciar sesión',
  }
  return titles[route.path] || 'CRM'
})

const setCollapsed = (v) => {
  collapsed.value = v
  try { localStorage.setItem('crm-sidebar', v ? 'collapsed' : 'open') } catch { /* noop */ }
}

const logout = async () => {
  await authStore.logout()
  mobileMenuOpen.value = false
  router.push('/login')
}

onMounted(() => {
  loadMarca()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
