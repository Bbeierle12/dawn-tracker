import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deriveFrostDatesForLocation } from '../utils/frost'

/**
 * Garden store — the gardening data layer for the planting calendar.
 *
 * Holds the two location-specific inputs the calendar needs:
 *   - USDA hardiness zone, fetched by ZIP from phzmapi.org
 *   - last/first frost dates, derived from Open-Meteo history (or set manually)
 *
 * Both are cached in localStorage and keyed to the location so we don't refetch
 * on every load. Mirrors the persist pattern in stores/locationStore.js.
 */

const PHZM_BASE = 'https://phzmapi.org'

/** Round lat/lng to a stable cache key (~1km granularity). */
function locationKey(lat, lng) {
  return `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`
}

/** Fetch USDA hardiness zone for a US ZIP code from phzmapi.org. */
async function fetchHardinessZone(zip) {
  const response = await fetch(`${PHZM_BASE}/${zip}.json`)
  if (!response.ok) {
    throw new Error(`No hardiness zone found for ZIP ${zip} (${response.status})`)
  }
  const data = await response.json()
  return {
    zone: data.zone,
    tempRange: data.temperature_range,
    coordinates: data.coordinates,
  }
}

export const useGardenStore = create(
  persist(
    (set, get) => ({
      zip: '',
      zone: null, // { zone, tempRange, coordinates, fetchedAt }
      frostDates: null, // { lastSpringFrost, firstFallFrost, frostFree, source, years, computedAt }
      frostLocationKey: null,

      loadingZone: false,
      loadingFrost: false,
      error: null,

      setZip: (zip) => set({ zip }),

      /** Look up hardiness zone for a ZIP and store it. */
      fetchZone: async (zip) => {
        const code = String(zip || '').trim()
        if (!code) return
        set({ loadingZone: true, error: null })
        try {
          const zone = await fetchHardinessZone(code)
          set({ zip: code, zone: { ...zone, fetchedAt: new Date().toISOString() }, loadingZone: false })
        } catch (err) {
          set({ loadingZone: false, error: err.message })
        }
      },

      /**
       * Ensure frost dates exist for the given location, deriving them from
       * Open-Meteo history if missing or stale. No-op if already cached for this
       * location and not a manual override.
       */
      ensureFrostDates: async (lat, lng) => {
        const key = locationKey(lat, lng)
        const { frostDates, frostLocationKey, loadingFrost } = get()
        if (loadingFrost) return
        if (frostDates && frostLocationKey === key) return
        if (frostDates?.source === 'manual') return // respect manual entry

        set({ loadingFrost: true, error: null })
        try {
          const derived = await deriveFrostDatesForLocation(lat, lng)
          set({
            frostDates: { ...derived, source: 'derived' },
            frostLocationKey: key,
            loadingFrost: false,
          })
        } catch (err) {
          set({ loadingFrost: false, error: err.message })
        }
      },

      /** Force re-derivation from weather history, discarding any manual override. */
      redriveFrostDates: async (lat, lng) => {
        set({ frostDates: null, frostLocationKey: null })
        await get().ensureFrostDates(lat, lng)
      },

      /** Override frost dates manually (e.g. user knows their microclimate). */
      setManualFrostDates: ({ lastSpringFrost, firstFallFrost }) =>
        set({
          frostDates: {
            lastSpringFrost: lastSpringFrost || null,
            firstFallFrost: firstFallFrost || null,
            frostFree: !lastSpringFrost && !firstFallFrost,
            source: 'manual',
            computedAt: new Date().toISOString(),
          },
          frostLocationKey: null,
        }),

      reset: () =>
        set({
          zip: '',
          zone: null,
          frostDates: null,
          frostLocationKey: null,
          loadingZone: false,
          loadingFrost: false,
          error: null,
        }),
    }),
    {
      name: 'dawn-tracker-garden',
      partialize: (state) => ({
        zip: state.zip,
        zone: state.zone,
        frostDates: state.frostDates,
        frostLocationKey: state.frostLocationKey,
      }),
    }
  )
)
