import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LOCATION } from '../utils/astronomy'

export const useLocationStore = create(
  persist(
    (set, get) => ({
      // Current location
      location: DEFAULT_LOCATION,

      // Actions
      setLocation: (location) => set({ location }),

      // Reset to default
      resetLocation: () => set({ location: DEFAULT_LOCATION })
    }),
    {
      name: 'dawn-tracker-location'
    }
  )
)
