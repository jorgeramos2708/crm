import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// In Docker, use relative URLs so nginx proxies to API
// In local dev, Vite proxy handles /api -> localhost:3001
const API_URL = import.meta.env.VITE_API_URL || ''

axios.defaults.withCredentials = true
axios.defaults.baseURL = API_URL

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      })
      user.value = response.data.user
      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Error de autenticación'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await axios.post('/api/auth/logout')
    } catch (e) {
      // Ignorar errores de logout
    }
    user.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  async function checkAuth() {
    try {
      const response = await axios.get('/api/auth/me')
      user.value = response.data.user
      return true
    } catch (e) {
      user.value = null
      return false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})