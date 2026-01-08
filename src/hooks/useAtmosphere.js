import { useEffect, useCallback } from 'react'
import { useAtmosphereStore } from '../stores/atmosphereStore'
import { fetchAtmosphericData, processAtmosphericData } from '../utils/atmosphere'

/**
 * Hook for atmospheric data with auto-refresh
 */
export function useAtmosphere(lat, lng) {
  const {
    data,
    lastFetch,
    isLoading,
    error,
    setData,
    setLoading,
    setError,
    needsRefresh
  } = useAtmosphereStore()

  const refresh = useCallback(async () => {
    if (isLoading) return

    setLoading(true)
    try {
      const rawData = await fetchAtmosphericData(lat, lng)
      const processedData = processAtmosphericData(rawData)
      setData(processedData)
    } catch (err) {
      setError(err.message)
    }
  }, [lat, lng, isLoading, setData, setLoading, setError])

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (needsRefresh()) {
      refresh()
    }

    // Refresh every 15 minutes
    const interval = setInterval(() => {
      if (needsRefresh()) {
        refresh()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [lat, lng, refresh, needsRefresh])

  // Refresh when location changes
  useEffect(() => {
    refresh()
  }, [lat, lng])

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refresh
  }
}
