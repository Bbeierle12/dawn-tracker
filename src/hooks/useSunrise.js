import { useState, useEffect, useCallback } from 'react'
import { getNextDawn, BAKERSFIELD } from '../utils/dawn'

/**
 * Hook to get and auto-update sunrise/dawn times
 */
export function useSunrise(lat = BAKERSFIELD.lat, lng = BAKERSFIELD.lng) {
  const [dawnData, setDawnData] = useState(() => getNextDawn(lat, lng))

  const refreshDawnTimes = useCallback(() => {
    setDawnData(getNextDawn(lat, lng))
  }, [lat, lng])

  useEffect(() => {
    // Initial calculation
    refreshDawnTimes()

    // Refresh at midnight each day
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight.getTime() - now.getTime()

    // Schedule midnight refresh
    const midnightTimeout = setTimeout(() => {
      refreshDawnTimes()
      // Then set up daily interval
      const dailyInterval = setInterval(refreshDawnTimes, 24 * 60 * 60 * 1000)
      return () => clearInterval(dailyInterval)
    }, msUntilMidnight)

    // Also refresh when dawn passes (to get next day's dawn)
    const checkInterval = setInterval(() => {
      const currentData = getNextDawn(lat, lng)
      if (currentData.civilTwilight.getTime() !== dawnData.civilTwilight?.getTime()) {
        setDawnData(currentData)
      }
    }, 60000) // Check every minute

    return () => {
      clearTimeout(midnightTimeout)
      clearInterval(checkInterval)
    }
  }, [lat, lng, refreshDawnTimes])

  return {
    civilTwilight: dawnData.civilTwilight,
    sunrise: dawnData.sunrise,
    nauticalTwilight: dawnData.nauticalTwilight,
    goldenHour: dawnData.goldenHour,
    isToday: dawnData.isToday,
    date: dawnData.date,
    refresh: refreshDawnTimes
  }
}
