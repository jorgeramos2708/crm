import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Login from "./views/Login.vue";
// Vistas con lazy-loading: cada ruta genera su propio chunk y reduce el bundle inicial
const Dashboard = () => import("./views/Dashboard.vue");
const Pipeline = () => import("./views/Pipeline.vue");
const Contactos = () => import("./views/Contactos.vue");
const Listas = () => import("./views/Listas.vue");
const Automatizaciones = () => import("./views/Automatizaciones.vue");
const Plantillas = () => import("./views/Plantillas.vue");
const Campanas = () => import("./views/Campanas.vue");
const Actividades = () => import("./views/Actividades.vue");
const Reportes = () => import("./views/Reportes.vue");
const Tareas = () => import("./views/Tareas.vue");
const Calendario = () => import("./views/Calendario.vue");
const Negocios = () => import("./views/Negocios.vue");
const Productos = () => import("./views/Productos.vue");
const Presupuestos = () => import("./views/Presupuestos.vue");
const Empresas = () => import("./views/Empresas.vue");
const Correos = () => import("./views/Correos.vue");
const Settings = () => import("./views/Settings.vue");
const Reuniones = () => import("./views/Reuniones.vue");
const AgendarReunion = () => import("./views/AgendarReunion.vue");
const NotFound = () => import("./views/NotFound.vue");
import { useAuthStore } from "./stores/auth";
import { toast } from "./utils/toast";
import axios from "axios";
import { createThemeProvider } from "./composables/useTheme";
import autoAnimate from "@formkit/auto-animate";
import "./style.css";

const pinia = createPinia();

// Validación nativa en español: "Campo obligatorio" en vez del inglés del navegador
document.addEventListener(
  "invalid",
  (e) => {
    const t = e.target;
    if (t && typeof t.setCustomValidity === "function") {
      if (t.validity.valueMissing) t.setCustomValidity("Campo obligatorio");
      else if (t.validity.typeMismatch)
        t.setCustomValidity("Revisa el formato de este campo");
      else if (t.validity.patternMismatch)
        t.setCustomValidity("El formato no es válido");
    }
  },
  true,
);
document.addEventListener(
  "input",
  (e) => {
    const t = e.target;
    if (t && typeof t.setCustomValidity === "function") t.setCustomValidity("");
  },
  true,
);
document.addEventListener(
  "change",
  (e) => {
    const t = e.target;
    if (t && typeof t.setCustomValidity === "function") t.setCustomValidity("");
  },
  true,
);

const routes = [
  { path: "/login", component: Login, meta: { guest: true } },
  { path: "/", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/pipeline", component: Pipeline, meta: { requiresAuth: true } },
  { path: "/contactos", component: Contactos, meta: { requiresAuth: true } },
  { path: "/listas", component: Listas, meta: { requiresAuth: true } },
  {
    path: "/automatizaciones",
    component: Automatizaciones,
    meta: { requiresAuth: true },
  },
  { path: "/plantillas", component: Plantillas, meta: { requiresAuth: true } },
  { path: "/campañas", component: Campanas, meta: { requiresAuth: true } },
  {
    path: "/actividades",
    component: Actividades,
    meta: { requiresAuth: true },
  },
  { path: "/reportes", component: Reportes, meta: { requiresAuth: true } },
  { path: "/tareas", component: Tareas, meta: { requiresAuth: true } },
  { path: "/calendario", component: Calendario, meta: { requiresAuth: true } },
  { path: "/negocios", component: Negocios, meta: { requiresAuth: true } },
  {
    path: "/negocios/crear",
    component: Negocios,
    meta: { requiresAuth: true },
  },
  { path: "/productos", component: Productos, meta: { requiresAuth: true } },
  {
    path: "/presupuestos",
    component: Presupuestos,
    meta: { requiresAuth: true },
  },
  { path: "/empresas", component: Empresas, meta: { requiresAuth: true } },
  { path: "/correos", component: Correos, meta: { requiresAuth: true } },
  { path: "/settings", component: Settings, meta: { requiresAuth: true } },
  { path: "/reuniones", component: Reuniones, meta: { requiresAuth: true } },
  { path: "/agendar/:slug", component: AgendarReunion },
  { path: "/:pathMatch(.*)*", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Módulos lazy: si el chunk falla (despliegue a mitad de sesión, red, AV),
// el router-view quedaría en blanco sin aviso. Una sola recarga lo cura
// (boot limpio = estado que siempre funciona); si repite, avisa.
let chunkRecargado = false;
router.onError((err) => {
  const msg = String(err?.message || err || "");
  if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(msg)) {
    if (!chunkRecargado) {
      chunkRecargado = true;
      toast.info("Actualizando módulo, recargando…");
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast.error("No se pudo cargar el módulo. Recarga la página.");
    }
  }
});

// Sesión global: ningún 401 deja pantallas en blanco.
// - Primer 401 (no auth): se revalida la sesión una vez; si sigue viva se
//   reintenta la petición original (transitorio superado).
// - Si la sesión murió: recarga a /login (boot limpio, sin estado rancio).
let revalidando = null;
axios.interceptors.response.use(
  (r) => r,
  async (error) => {
    const { config, response } = error || {};
    const url = config?.url || "";
    if (!config || !response || response.status !== 401 || config._authRetry) {
      return Promise.reject(error);
    }
    if (url.startsWith("/api/auth/")) return Promise.reject(error);
    config._authRetry = true;
    try {
      revalidando ??= axios.get("/api/auth/me").finally(() => {
        revalidando = null;
      });
      const me = await revalidando;
      useAuthStore().user = me.data?.user || null;
      return axios(config);
    } catch {
      useAuthStore().user = null;
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  },
);

router.beforeEach(async (to, from, next) => {
  // El navegador entrega location.pathname percent-encoded (ej: /campa%C3%B1as)
  // y Vue Router no decodifica antes de matchear → 0 matches → pantalla en blanco
  // en hard reload. Reintentar con el path decodificado.
  if (!to.matched.length) {
    try {
      const decodedPath = decodeURIComponent(to.path);
      if (decodedPath !== to.path) {
        next({ path: decodedPath, query: to.query, hash: to.hash });
        return;
      }
    } catch {
      /* path no válido para decode */
    }
  }

  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      const isValid = await authStore.checkAuth();
      if (!isValid) {
        next("/login");
        return;
      }
    }
  } else if (to.meta.guest) {
    if (authStore.isAuthenticated) {
      next("/");
      return;
    }
  }
  next();
});

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(createThemeProvider());

// FLIP animation para listas (v-auto-animate). Respeta prefers-reduced-motion.
app.directive("auto-animate", {
  mounted(el) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.__aa_ctl = autoAnimate(el);
  },
  unmounted(el) {
    el.__aa_ctl?.destroy?.();
    delete el.__aa_ctl;
  },
});

app.mount("#app");

// PWA: registrar SW solo en producción/build (no en Vitest)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {});
}
