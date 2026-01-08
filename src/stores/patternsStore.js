import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectAllPatterns } from '../utils/patterns'

export const usePatternsStore = create(
  persist(
    (set, get) => ({
      // Discovered patterns
      patterns: [],

      // Atmosphere history for cross-referencing
      atmosphereHistory: [],

      // Last detection timestamp
      lastDetection: null,

      // Add atmosphere reading to history
      recordAtmosphere: (atmosphereData) => {
        if (!atmosphereData?.current) return

        set(state => {
          const newHistory = [
            ...state.atmosphereHistory,
            {
              timestamp: new Date().toISOString(),
              current: atmosphereData.current,
              hourlyForecast: atmosphereData.hourlyForecast?.slice(0, 6) // Keep 6 hours for size
            }
          ]

          // Keep last 30 days of history (max ~720 entries at 1/hr)
          const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
          const filtered = newHistory.filter(
            a => new Date(a.timestamp).getTime() > thirtyDaysAgo
          )

          return { atmosphereHistory: filtered }
        })
      },

      // Run pattern detection
      detectPatterns: (records) => {
        const { atmosphereHistory } = get()
        const detected = detectAllPatterns(records, atmosphereHistory)

        set(state => {
          // Merge with existing patterns, updating duplicates
          const patternMap = new Map()

          // Add existing patterns
          state.patterns.forEach(p => patternMap.set(p.id, p))

          // Update/add new patterns
          detected.forEach(p => {
            const existing = patternMap.get(p.id)
            if (!existing || p.confidence > existing.confidence) {
              patternMap.set(p.id, p)
            }
          })

          return {
            patterns: Array.from(patternMap.values())
              .sort((a, b) => b.confidence - a.confidence),
            lastDetection: new Date().toISOString()
          }
        })

        return detected
      },

      // Dismiss a pattern
      dismissPattern: (patternId) => {
        set(state => ({
          patterns: state.patterns.filter(p => p.id !== patternId)
        }))
      },

      // Clear all patterns
      clearPatterns: () => {
        set({ patterns: [], lastDetection: null })
      },

      // Get patterns by type
      getPatternsByType: (type) => {
        return get().patterns.filter(p => p.type === type)
      },

      // Get high confidence patterns only
      getHighConfidencePatterns: () => {
        return get().patterns.filter(p => p.confidence >= 0.85)
      }
    }),
    {
      name: 'dawn-tracker-patterns',
      version: 1
    }
  )
)
