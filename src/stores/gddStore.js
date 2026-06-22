import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchDailyTemps } from '../utils/gdd'

/**
 * Caches the daily temperature series used for GDD harvest prediction.
 * One fetch per location, refreshed at most twice a day. Mirrors the cache-with-TTL
 * approach in stores/atmosphereStore.js.
 */

const TTL_MS = 12 * 60 * 60 * 1000 // 12 hours

function locationKey(lat, lng) {
  return `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`
}

export const useGddStore = create(
  persist(
    (set, get) => ({
      dailyTemps: null, // { time, temperature_2m_max, temperature_2m_min }
      locationKey: null,
      fetchedAt: 0,
      loading: false,
      error: null,

      ensure: async (lat, lng) => {
        const key = locationKey(lat, lng)
        const { locationKey: cur, fetchedAt, dailyTemps, loading } = get()
        if (loading) return
        const fresh = cur === key && dailyTemps && Date.now() - fetchedAt < TTL_MS
        if (fresh) return

        set({ loading: true, error: null })
        try {
          const daily = await fetchDailyTemps(lat, lng)
          set({ dailyTemps: daily, locationKey: key, fetchedAt: Date.now(), loading: false })
        } catch (err) {
          set({ loading: false, error: err.message })
        }
      },
    }),
    {
      name: 'dawn-tracker-gdd',
      partialize: (s) => ({ dailyTemps: s.dailyTemps, locationKey: s.locationKey, fetchedAt: s.fetchedAt }),
    }
  )
)
