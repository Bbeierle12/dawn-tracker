import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAtmosphereStore = create(
  persist(
    (set, get) => ({
      // Current atmospheric data
      data: null,
      lastFetch: null,
      isLoading: false,
      error: null,

      // Actions
      setData: (data) => set({
        data,
        lastFetch: Date.now(),
        isLoading: false,
        error: null
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({
        error,
        isLoading: false
      }),

      // Check if data needs refresh (older than 15 minutes)
      needsRefresh: () => {
        const { lastFetch } = get()
        if (!lastFetch) return true
        return Date.now() - lastFetch > 15 * 60 * 1000
      },

      clearData: () => set({
        data: null,
        lastFetch: null,
        error: null
      })
    }),
    {
      name: 'dawn-tracker-atmosphere',
      partialize: (state) => ({
        data: state.data,
        lastFetch: state.lastFetch
      })
    }
  )
)
