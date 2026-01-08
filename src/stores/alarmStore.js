import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAlarmStore = create(
  persist(
    (set, get) => ({
      // Alarm state
      isEnabled: true,
      isRinging: false,

      // Snooze tracking
      snoozeCount: 0,
      totalSnoozeCount: 0, // Lifetime shame counter
      lastSnoozeTime: null,

      // Settings
      snoozeDurationMinutes: 5,

      // Dawn times (updated daily)
      civilTwilight: null,
      officialSunrise: null,

      // Actions
      toggleAlarm: () => set((state) => ({ isEnabled: !state.isEnabled })),

      setAlarmEnabled: (enabled) => set({ isEnabled: enabled }),

      triggerAlarm: () => set({ isRinging: true }),

      dismissAlarm: () => set({
        isRinging: false,
        snoozeCount: 0,
        lastSnoozeTime: null
      }),

      snooze: () => {
        const now = Date.now()
        set((state) => ({
          isRinging: false,
          snoozeCount: state.snoozeCount + 1,
          totalSnoozeCount: state.totalSnoozeCount + 1,
          lastSnoozeTime: now
        }))
        return get().snoozeDurationMinutes * 60 * 1000
      },

      setDawnTimes: (civilTwilight, officialSunrise) => set({
        civilTwilight,
        officialSunrise
      }),

      resetDailySnooze: () => set({ snoozeCount: 0 })
    }),
    {
      name: 'butt-crack-dawn-storage',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        totalSnoozeCount: state.totalSnoozeCount,
        snoozeDurationMinutes: state.snoozeDurationMinutes
      })
    }
  )
)
