<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
    <div class="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-zinc-100">CRM</h1>
        <p class="text-zinc-500 mt-2">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full mt-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none"
            placeholder="admin@crm.local"
          />
        </div>

        <div>
          <label class="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
            Contraseña
          </label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full mt-1 px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none"
            placeholder="admin1234"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 px-4 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Iniciando sesión...
          </span>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-zinc-500">
        <p>Credenciales de prueba:</p>
        <p class="font-mono text-xs">admin@crm.local / admin1234</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('admin@crm.local')
const password = ref('admin1234')
const loading = ref(false)
const error = ref(null)

const handleSubmit = async () => {
  error.value = null
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/')
  } else {
    error.value = authStore.error
  }
}
</script>

<style scoped>
input:focus {
  @apply ring-2 ring-zinc-900 dark:ring-zinc-400 border-transparent;
}
</style>