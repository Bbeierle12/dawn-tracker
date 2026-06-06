import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Garden journal — the record of what you actually planted and harvested.
 *
 * One entry per planting (a crop sown on a date in a place). Harvests are logged
 * against the planting over time. Persisted to localStorage, offline-first, no
 * backend — same pattern as the other stores.
 */

function newId() {
  // crypto.randomUUID is available in modern browsers and Node 18+.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
}

export const useJournalStore = create(
  persist(
    (set, get) => ({
      plantings: [],

      /** Add a planting. Returns the new id. */
      addPlanting: ({ cropId, cropName, emoji, location, sowDate, method, daysToMaturity, tender, notes, status }) => {
        const planting = {
          id: newId(),
          cropId: cropId || null,
          cropName,
          emoji: emoji || '🌱',
          location: location || '',
          sowDate, // 'YYYY-MM-DD'
          method: method || '',
          daysToMaturity: daysToMaturity ?? null,
          tender: tender ?? null,
          status: status || 'growing', // planned | growing | harvested | failed
          harvests: [], // [{ date, amount, note }]
          notes: notes || '',
          createdAt: new Date().toISOString(),
        }
        set({ plantings: [planting, ...get().plantings] })
        return planting.id
      },

      updatePlanting: (id, patch) =>
        set({ plantings: get().plantings.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),

      setStatus: (id, status) => get().updatePlanting(id, { status }),

      /** Log a harvest against a planting and mark it harvested. */
      addHarvest: (id, { date, amount, note }) =>
        set({
          plantings: get().plantings.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'harvested',
                  harvests: [...p.harvests, { date, amount: amount || '', note: note || '' }],
                }
              : p
          ),
        }),

      removePlanting: (id) => set({ plantings: get().plantings.filter((p) => p.id !== id) }),

      clearJournal: () => set({ plantings: [] }),
    }),
    {
      name: 'dawn-tracker-journal',
    }
  )
)
