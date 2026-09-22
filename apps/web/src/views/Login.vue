<template>
  <div class="relative flex h-dvh items-center justify-center overflow-hidden px-4">
    <!-- Fondo: foto personalizada, color sólido o malla cálida por defecto -->
    <div class="pointer-events-none absolute inset-0 bg-[#e9e4d9] dark:bg-zinc-950" :style="fondoSolido ? { backgroundColor: fondoSolido } : {}">
      <img
        v-if="fondoFoto"
        :src="fondoFoto"
        alt=""
        class="h-full w-full scale-105 object-cover opacity-70 blur-[6px]"
      />
      <template v-if="!fondoFoto && !fondoSolido">
        <div class="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#d7d0c2] opacity-60 blur-3xl dark:bg-zinc-800"></div>
        <div class="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-[#cfc8b8] opacity-50 blur-3xl dark:bg-zinc-800"></div>
      </template>
      <div class="absolute inset-0 bg-white/50 dark:bg-black/60"></div>
    </div>

    <div class="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_20px_60px_-15px_rgba(28,25,23,0.25)] dark:bg-zinc-800">
      <div class="mb-4 text-center">
        <img v-if="marca.logo" :src="marca.logo" alt="logo" class="mx-auto mb-3 h-20 w-20 rounded-2xl object-cover" />
        <p class="font-sans text-3xl font-bold tracking-wide text-zinc-900 dark:text-zinc-50">{{ marca.nombre }}</p>
        <h1 class="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Inicio de sesión</h1>
      </div>

      <div v-if="error" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Correo electrónico</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <input
              v-model="email"
              type="email"
              required
              placeholder="nombre@empresa.com"
              class="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-4 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">Contraseña</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input
              v-model="password"
              :type="verPassword ? 'text' : 'password'"
              required
              placeholder="••••••••••"
              class="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-11 pr-12 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
            <button type="button" @click="verPassword = !verPassword" :title="verPassword ? 'Ocultar' : 'Mostrar'" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600">
              <svg v-if="verPassword" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.948 9.948 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-zinc-900 py-3 px-4 font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Iniciando sesión...
          </span>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>

      <div class="my-4 flex items-center gap-3">
        <span class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></span>
        <span class="text-xs text-zinc-500">O continuar con...</span>
        <span class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button @click="sso('google')" class="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
          <svg class="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" /><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" /></svg>
          Google
        </button>
        <button @click="sso('microsoft')" class="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
          <svg class="h-5 w-5" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022" /><rect x="13" y="1" width="10" height="10" fill="#7FBA00" /><rect x="1" y="13" width="10" height="10" fill="#00A4EF" /><rect x="13" y="13" width="10" height="10" fill="#FFB900" /></svg>
          Microsoft
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { marca, loadMarca } from '../utils/marca'

const fondoFoto = computed(() => {
  if (marca.value.fondo && marca.value.fondo.startsWith('data:')) return marca.value.fondo
  // Sin imagen por defecto: no existe /fondo-oficina.jpg; se usa la malla cálida del template
  return ''
})
const fondoSolido = computed(() => {
  const f = marca.value.fondo || ''
  return /^#[0-9a-fA-F]{6}$/.test(f) ? f : ''
})

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const verPassword = ref(false)
const loading = ref(false)
const error = ref(null)

const ERRORES_SSO = {
  sso_cancelado: 'Cancelaste el inicio de sesión.',
  sso_invalido: 'Sesión de SSO inválida, inténtalo de nuevo.',
  sso_expirado: 'La sesión de SSO expiró, inténtalo de nuevo.',
  sso_no_configurado: 'El proveedor no está configurado. Avisa a tu administrador.',
  sso_sin_cuenta: 'No hay cuenta con ese correo. Pide a tu administrador que te dé de alta.',
  sso_inactivo: 'Tu cuenta está inactiva. Contacta a tu administrador.',
  sso_sin_email: 'No se pudo leer tu correo. Inténtalo de nuevo.',
  sso_error: 'Error iniciando sesión. Inténtalo de nuevo.',
}

const handleSubmit = async () => {
  error.value = null
  loading.value = true
  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push('/')
    } else {
      error.value = authStore.error
    }
  } finally {
    loading.value = false
  }
}

const sso = (proveedor) => {
  window.location.href = `/api/auth/${proveedor}/login`
}

onMounted(async () => {
  loadMarca()
  if (route.query.error) {
    error.value = ERRORES_SSO[route.query.error] || 'Error iniciando sesión.'
  }
  if (authStore.isAuthenticated || await authStore.checkAuth()) {
    router.push('/')
  }
})
</script>
