<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex text-zinc-900 dark:text-zinc-100">
    <!-- Sidebar escritorio -->
    <aside v-if="authStore.isAuthenticated" class="hidden lg:flex flex-col min-h-screen bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transition-all duration-200" :class="collapsed ? 'w-[76px]' : 'w-[272px]'">
      <div class="border-b border-zinc-200 dark:border-zinc-700" :class="collapsed ? 'px-2 py-3' : 'px-4 h-16'">
        <div class="flex items-center gap-3" :class="collapsed ? 'flex-col gap-2' : 'h-full'">
          <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-base font-bold">C</span>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-[15px] font-semibold leading-5">CRM</p>
            <p class="truncate text-xs text-zinc-500">Espacio de trabajo</p>
          </div>
          <button @click="setCollapsed(!collapsed)" :title="collapsed ? 'Expandir menú' : 'Contraer menú'" class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-100">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7M19 19l-7-7 7-7'" /></svg>
          </button>
        </div>
      </div>

      <div v-if="!collapsed" class="px-3 pt-3">
        <div class="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
          <svg class="h-4 w-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="menuQuery" type="text" placeholder="Buscar en el menú" class="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 pb-3">
        <!-- Acceso directo -->
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
          <span class="text-lg leading-none">🏠</span>
          <span v-if="!collapsed">Resumen</span>
        </router-link>

        <!-- Grupos desplegables -->
        <template v-for="group in filteredGroups" :key="group.label">
          <button
            v-if="!collapsed && group.items.length"
            @click="toggleGroup(group.label)"
            class="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
            :class="groupActive(group) ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            <span class="text-lg leading-none">{{ group.icon }}</span>
            <span class="flex-1 text-left">{{ group.label }}</span>
            <svg class="h-4 w-4 transition-transform" :class="openGroups.includes(group.label) ? '' : '-rotate-90'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-if="collapsed && group.items.length" class="mx-3 mb-1 mt-3 border-t border-zinc-200 dark:border-zinc-700"></div>
          <div v-show="collapsed || openGroups.includes(group.label)" class="overflow-hidden">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :title="collapsed ? item.name : ''"
              class="mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
                collapsed ? 'justify-center px-0' : 'ml-4'
              ]"
            >
              <span class="text-lg leading-none">{{ item.icon }}</span>
              <span v-if="!collapsed">{{ item.name }}</span>
            </router-link>
          </div>
        </template>
        <p v-if="!filteredGroups.some(g => g.items.length)" class="px-3 py-6 text-sm text-zinc-400">Sin coincidencias.</p>

        <!-- Configuración fija al fondo -->
        <router-link
          to="/settings"
          :title="collapsed ? 'Configuración' : ''"
          class="mt-2 flex items-center gap-3 rounded-xl border-t border-zinc-200 dark:border-zinc-700 px-3 py-2.5 pt-4 text-sm transition-colors"
          :class="[
            isActive('/settings')
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
            collapsed ? 'justify-center px-0' : ''
          ]"
        >
          <span class="text-lg leading-none">⚙️</span>
          <span v-if="!collapsed">Configuración</span>
        </router-link>
      </nav>

      <div class="border-t border-zinc-200 dark:border-zinc-700 p-3">
        <div class="flex items-center gap-3 rounded-xl px-2 py-2" :class="collapsed ? 'justify-center' : ''">
          <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{{ initial }}</span>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium leading-5">{{ authStore.user?.name || 'Usuario' }}</p>
            <p class="truncate text-xs text-zinc-500">{{ authStore.user?.email || '' }}</p>
          </div>
          <button @click="logout" title="Cerrar sesión" class="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Botón menú móvil -->
    <button v-if="authStore.isAuthenticated" @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden fixed left-4 top-4 z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 shadow-sm">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'" /></svg>
    </button>

    <!-- Panel móvil -->
    <div v-if="mobileMenuOpen && authStore.isAuthenticated" class="lg:hidden fixed inset-0 z-40 bg-black/50" @click="mobileMenuOpen = false"></div>
    <aside v-if="mobileMenuOpen && authStore.isAuthenticated" class="lg:hidden fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-white dark:bg-zinc-800">
      <div class="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 px-4 h-16">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-base font-bold">C</span>
        <p class="flex-1 text-[15px] font-semibold">CRM</p>
        <button @click="mobileMenuOpen = false" class="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto p-3">
        <router-link to="/" @click="mobileMenuOpen = false" class="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><span class="text-lg">🏠</span> Resumen</router-link>
        <template v-for="group in navGroups" :key="group.label">
          <button @click="toggleGroup(group.label)" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400">
            <span class="text-lg">{{ group.icon }}</span>
            <span class="flex-1 text-left font-medium">{{ group.label }}</span>
            <svg class="h-4 w-4 transition-transform" :class="openGroups.includes(group.label) ? '' : '-rotate-90'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div v-show="openGroups.includes(group.label)">
            <router-link v-for="item in group.items" :key="item.to" :to="item.to" @click="mobileMenuOpen = false" class="ml-4 mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><span class="text-lg">{{ item.icon }}</span> {{ item.name }}</router-link>
          </div>
        </template>
        <router-link to="/settings" @click="mobileMenuOpen = false" class="mt-1 flex items-center gap-3 rounded-xl border-t border-zinc-200 dark:border-zinc-700 px-3 py-2.5 pt-4 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"><span class="text-lg">⚙️</span> Configuración</router-link>
      </nav>
      <div class="border-t border-zinc-200 dark:border-zinc-700 p-3">
        <button @click="logout" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Cerrar sesión</button>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="min-w-0 flex-1">
      <header v-if="authStore.isAuthenticated" class="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 pl-14 lg:pl-6">
          <div class="min-w-0">
            <h1 class="truncate text-lg font-semibold">{{ pageTitle }}</h1>
            <p class="hidden text-xs text-zinc-500 sm:block">{{ fechaHoy }}</p>
          </div>
        </div>
      </header>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)
const collapsed = ref(localStorage.getItem('crm-sidebar') === 'collapsed')
const menuQuery = ref('')

const toggleCollapsed = (v) => {
  collapsed.value = v
  localStorage.setItem('crm-sidebar', v ? 'collapsed' : 'open')
}

const navGroups = [
  {
    label: 'Ventas',
    icon: '🤝',
    items: [
      { to: '/contactos', name: 'Contactos', icon: '👥' },
      { to: '/empresas', name: 'Empresas', icon: '🏢' },
      { to: '/pipeline', name: 'Pipeline', icon: '📊' },
      { to: '/negocios', name: 'Negocios', icon: '💼' },
      { to: '/presupuestos', name: 'Presupuestos', icon: '📄' },
      { to: '/productos', name: 'Productos', icon: '📦' },
    ],
  },
  {
    label: 'Marketing y Mensajería',
    icon: '📣',
    items: [
      { to: '/correos', name: 'Correos', icon: '📬' },
      { to: '/campañas', name: 'Campañas', icon: '🎯' },
      { to: '/plantillas', name: 'Plantillas', icon: '📄' },
      { to: '/listas', name: 'Listas', icon: '📋' },
    ],
  },
  {
    label: 'Agenda y Tareas',
    icon: '📅',
    items: [
      { to: '/calendario', name: 'Calendario', icon: '🗓️' },
      { to: '/tareas', name: 'Tareas', icon: '✅' },
      { to: '/actividades', name: 'Actividades', icon: '🔄' },
    ],
  },
  {
    label: 'Operaciones y Reportes',
    icon: '📈',
    items: [
      { to: '/automatizaciones', name: 'Automatizaciones', icon: '⚡' },
      { to: '/reportes', name: 'Reportes', icon: '📊' },
    ],
  },
]

const openGroups = ref(JSON.parse(localStorage.getItem('crm-nav-open') || '["Ventas"]'))

const toggleGroup = (label) => {
  openGroups.value = openGroups.value.includes(label)
    ? openGroups.value.filter(l => l !== label)
    : [...openGroups.value, label]
  localStorage.setItem('crm-nav-open', JSON.stringify(openGroups.value))
}

const groupActive = (group) => group.items.some(i => isActive(i.to))

const filteredGroups = computed(() => {
  const q = menuQuery.value.trim().toLowerCase()
  if (!q) return navGroups
  return navGroups.map(g => ({
    ...g,
    items: g.items.filter(i => i.name.toLowerCase().includes(q)),
  }))
})

const isActive = (path) => route.path === path

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

const setCollapsed = (v) => toggleCollapsed(v)

const logout = async () => {
  await authStore.logout()
  mobileMenuOpen.value = false
  router.push('/login')
}
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
