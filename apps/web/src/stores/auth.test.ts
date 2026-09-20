import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('axios', () => {
  const mockDefaults = {
    withCredentials: true,
    baseURL: '',
    headers: { common: {} }
  }
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      defaults: mockDefaults
    }
  }
})

import axios from 'axios'
import { useAuthStore } from './auth.js'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    axios.defaults.headers.common = {}
  })

  it('should have initial state', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('should login successfully', async () => {
    const store = useAuthStore()
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' }
    
    ;(axios.post as any).mockResolvedValueOnce({ data: { user: mockUser } })
    
    const result = await store.login('test@test.com', 'password')
    
    expect(result).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.error).toBeNull()
  })

  it('should handle login failure', async () => {
    const store = useAuthStore()
    
    ;(axios.post as any).mockRejectedValueOnce({
      response: { data: { message: 'Credenciales inválidas' } }
    })
    
    const result = await store.login('test@test.com', 'wrong')
    
    expect(result).toBe(false)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBe('Credenciales inválidas')
  })

  it('should logout and clear state', async () => {
    const store = useAuthStore()
    store.user = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' }
    
    ;(axios.post as any).mockResolvedValueOnce({})
    
    await store.logout()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('should check auth with valid token', async () => {
    const store = useAuthStore()
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' }
    
    ;(axios.get as any).mockResolvedValueOnce({ data: { user: mockUser } })
    
    const result = await store.checkAuth()
    
    expect(result).toBe(true)
    expect(store.user).toEqual(mockUser)
  })

  it('should check auth with invalid token', async () => {
    const store = useAuthStore()
    
    ;(axios.get as any).mockRejectedValueOnce({})
    
    const result = await store.checkAuth()
    
    expect(result).toBe(false)
    expect(store.user).toBeNull()
  })
})