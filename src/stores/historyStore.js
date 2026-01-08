import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSolarTimes, getLunarTimes, getMoonIllumination, getDaylightDuration } from '../utils/astronomy'

/**
 * Format date as YYYY-MM-DD for consistent keys
 */
function formatDateKey(date) {
  return date.toISOString().split('T')[0]
}

/**
 * Get date from key
 */
function parseDateKey(key) {
  return new Date(key + 'T12:00:00')
}

export const useHistoryStore = create(
  persist(
    (set, get) => ({
      // Daily records: { 'YYYY-MM-DD': { ... } }
      dailyRecords: {},

      // First recorded date
      firstRecordDate: null,

      // Record today's astronomical data
      recordDay: (data) => {
        const dateKey = formatDateKey(new Date())
        const { dailyRecords, firstRecordDate } = get()

        // Don't overwrite if already recorded today (unless data changed)
        const existingRecord = dailyRecords[dateKey]

        const record = {
          date: dateKey,
          timestamp: Date.now(),
          location: {
            name: data.location?.name,
            lat: data.location?.lat,
            lng: data.location?.lng
          },
          solar: {
            sunrise: data.sunTimes?.sunrise?.toISOString(),
            sunset: data.sunTimes?.sunset?.toISOString(),
            solarNoon: data.sunTimes?.solarNoon?.toISOString(),
            civilDawn: data.sunTimes?.civilDawn?.toISOString(),
            civilDusk: data.sunTimes?.civilDusk?.toISOString(),
            daylightMinutes: data.daylight?.totalMinutes
          },
          lunar: {
            phase: data.moonIllumination?.phase,
            phaseName: data.moonIllumination?.phaseName,
            illumination: data.moonIllumination?.percentIlluminated,
            moonrise: data.moonTimes?.moonrise?.toISOString(),
            moonset: data.moonTimes?.moonset?.toISOString()
          }
        }

        set({
          dailyRecords: {
            ...dailyRecords,
            [dateKey]: record
          },
          firstRecordDate: firstRecordDate || dateKey
        })

        return record
      },

      // Get records for a date range
      getRecordsInRange: (startDate, endDate) => {
        const { dailyRecords } = get()
        const records = []
        const current = new Date(startDate)
        const end = new Date(endDate)

        while (current <= end) {
          const key = formatDateKey(current)
          if (dailyRecords[key]) {
            records.push(dailyRecords[key])
          }
          current.setDate(current.getDate() + 1)
        }

        return records
      },

      // Get last N days of records
      getRecentRecords: (days = 30) => {
        const { dailyRecords } = get()
        const records = []
        const today = new Date()

        for (let i = 0; i < days; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const key = formatDateKey(date)
          if (dailyRecords[key]) {
            records.unshift(dailyRecords[key])
          }
        }

        return records
      },

      // Get statistics
      getStatistics: () => {
        const { dailyRecords, firstRecordDate } = get()
        const records = Object.values(dailyRecords)

        if (records.length === 0) {
          return null
        }

        // Calculate stats
        const daylightMinutes = records
          .map(r => r.solar?.daylightMinutes)
          .filter(d => d != null)

        const longestDay = daylightMinutes.length > 0
          ? Math.max(...daylightMinutes)
          : null

        const shortestDay = daylightMinutes.length > 0
          ? Math.min(...daylightMinutes)
          : null

        const avgDaylight = daylightMinutes.length > 0
          ? Math.round(daylightMinutes.reduce((a, b) => a + b, 0) / daylightMinutes.length)
          : null

        // Find records with longest/shortest days
        const longestDayRecord = records.find(r => r.solar?.daylightMinutes === longestDay)
        const shortestDayRecord = records.find(r => r.solar?.daylightMinutes === shortestDay)

        // Moon phase distribution
        const phaseCount = {}
        records.forEach(r => {
          if (r.lunar?.phaseName) {
            phaseCount[r.lunar.phaseName] = (phaseCount[r.lunar.phaseName] || 0) + 1
          }
        })

        // Full moons and new moons
        const fullMoons = records.filter(r => r.lunar?.phaseName === 'Full Moon')
        const newMoons = records.filter(r => r.lunar?.phaseName === 'New Moon')

        return {
          totalDaysTracked: records.length,
          firstRecordDate,
          lastRecordDate: formatDateKey(new Date()),
          daylight: {
            longest: longestDay,
            longestDate: longestDayRecord?.date,
            shortest: shortestDay,
            shortestDate: shortestDayRecord?.date,
            average: avgDaylight,
            current: records[records.length - 1]?.solar?.daylightMinutes
          },
          lunar: {
            phaseDistribution: phaseCount,
            fullMoonCount: fullMoons.length,
            newMoonCount: newMoons.length,
            lastFullMoon: fullMoons[fullMoons.length - 1]?.date,
            lastNewMoon: newMoons[newMoons.length - 1]?.date
          }
        }
      },

      // Clear all history
      clearHistory: () => set({
        dailyRecords: {},
        firstRecordDate: null
      }),

      // Backfill historical data for past N days
      backfillHistory: (days = 90, location = { lat: 35.3733, lng: -119.0187, name: 'Bakersfield, CA' }) => {
        const { dailyRecords } = get()
        const newRecords = { ...dailyRecords }
        let firstDate = null

        for (let i = days; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues

          const dateKey = formatDateKey(date)

          // Skip if we already have data for this day
          if (newRecords[dateKey]) continue

          // Calculate astronomical data for this date
          const sunTimes = getSolarTimes(date, location.lat, location.lng)
          const moonTimes = getLunarTimes(date, location.lat, location.lng)
          const moonIllumination = getMoonIllumination(date)
          const daylight = getDaylightDuration(date, location.lat, location.lng)

          const record = {
            date: dateKey,
            timestamp: date.getTime(),
            location: {
              name: location.name,
              lat: location.lat,
              lng: location.lng
            },
            solar: {
              sunrise: sunTimes.sunrise?.toISOString(),
              sunset: sunTimes.sunset?.toISOString(),
              solarNoon: sunTimes.solarNoon?.toISOString(),
              civilDawn: sunTimes.civilDawn?.toISOString(),
              civilDusk: sunTimes.civilDusk?.toISOString(),
              daylightMinutes: daylight?.totalMinutes
            },
            lunar: {
              phase: moonIllumination.phase,
              phaseName: moonIllumination.phaseName,
              illumination: moonIllumination.percentIlluminated,
              moonrise: moonTimes.moonrise?.toISOString(),
              moonset: moonTimes.moonset?.toISOString()
            }
          }

          newRecords[dateKey] = record

          if (!firstDate || dateKey < firstDate) {
            firstDate = dateKey
          }
        }

        set(state => ({
          dailyRecords: newRecords,
          firstRecordDate: firstDate || state.firstRecordDate
        }))

        return Object.keys(newRecords).length
      }
    }),
    {
      name: 'dawn-tracker-history',
      version: 1
    }
  )
)
