import { useEffect } from 'react'
import { useGddStore } from '../stores/gddStore'

/**
 * Ensures the daily-temperature series for GDD prediction is loaded for a
 * location, and returns the current cache state. Used by the Garden Journal.
 */
export function useGddData(lat, lng) {
  const { dailyTemps, loading, error, ensure } = useGddStore()

  useEffect(() => {
    ensure(lat, lng)
  }, [lat, lng, ensure])

  return { dailyTemps, loading, error }
}
