import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      
      setAuth: (token, refreshToken, user) => 
        set({ user, token, refreshToken }),
      
      setToken: (token) => 
        set({ token }),
      
      setUser: (user) => 
        set({ user }),
      
      logout: () => 
        set({ user: null, token: null, refreshToken: null }),
      
      isAuthenticated: () => {
        const state = get()
        return !!state.token
      },
      
      hasRole: (roles) => {
        const state = get()
        if (!state.user) return false
        return Array.isArray(roles) 
          ? roles.includes(state.user.role)
          : state.user.role === roles
      },
    }),
    {
      name: 'itadis-auth-storage',
    }
  )
)
