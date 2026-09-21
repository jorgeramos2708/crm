import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Pipeline from './views/Pipeline.vue'
import Dashboard from './views/Dashboard.vue'
import Login from './views/Login.vue'
import Contactos from './views/Contactos.vue'
import Listas from './views/Listas.vue'
import Automatizaciones from './views/Automatizaciones.vue'
import Plantillas from './views/Plantillas.vue'
import Campanas from './views/Campanas.vue'
import Actividades from './views/Actividades.vue'
import Reportes from './views/Reportes.vue'
import Tareas from './views/Tareas.vue'
import Calendario from './views/Calendario.vue'
import Negocios from './views/Negocios.vue'
import Productos from './views/Productos.vue'
import Presupuestos from './views/Presupuestos.vue'
import Empresas from './views/Empresas.vue'
import Correos from './views/Correos.vue'
import Settings from './views/Settings.vue'
import { useAuthStore } from './stores/auth'
import '@fontsource-variable/plus-jakarta-sans'
import './style.css'

const pinia = createPinia()

// Validación nativa en español: "Campo obligatorio" en vez del inglés del navegador
document.addEventListener('invalid', (e) => {
  const t = e.target
  if (t && typeof t.setCustomValidity === 'function') {
    if (t.validity.valueMissing) t.setCustomValidity('Campo obligatorio')
    else if (t.validity.typeMismatch) t.setCustomValidity('Revisa el formato de este campo')
    else if (t.validity.patternMismatch) t.setCustomValidity('El formato no es válido')
  }
}, true)
document.addEventListener('input', (e) => {
  const t = e.target
  if (t && typeof t.setCustomValidity === 'function') t.setCustomValidity('')
}, true)
document.addEventListener('change', (e) => {
  const t = e.target
  if (t && typeof t.setCustomValidity === 'function') t.setCustomValidity('')
}, true)

const routes = [
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/pipeline', component: Pipeline, meta: { requiresAuth: true } },
  { path: '/contactos', component: Contactos, meta: { requiresAuth: true } },
  { path: '/listas', component: Listas, meta: { requiresAuth: true } },
  { path: '/automatizaciones', component: Automatizaciones, meta: { requiresAuth: true } },
  { path: '/plantillas', component: Plantillas, meta: { requiresAuth: true } },
  { path: '/campañas', component: Campanas, meta: { requiresAuth: true } },
  { path: '/actividades', component: Actividades, meta: { requiresAuth: true } },
  { path: '/reportes', component: Reportes, meta: { requiresAuth: true } },
  { path: '/tareas', component: Tareas, meta: { requiresAuth: true } },
  { path: '/calendario', component: Calendario, meta: { requiresAuth: true } },
  { path: '/negocios', component: Negocios, meta: { requiresAuth: true } },
  { path: '/productos', component: Productos, meta: { requiresAuth: true } },
  { path: '/presupuestos', component: Presupuestos, meta: { requiresAuth: true } },
  { path: '/empresas', component: Empresas, meta: { requiresAuth: true } },
  { path: '/correos', component: Correos, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      const isValid = await authStore.checkAuth()
      if (!isValid) {
        next('/login')
        return
      }
    }
  } else if (to.meta.guest) {
    if (authStore.isAuthenticated) {
      next('/')
      return
    }
  }
  next()
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')