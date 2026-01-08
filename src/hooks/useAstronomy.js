import { useState, useEffect, useCallback } from 'react'
import {
  getAstronomicalData,
  getDayTimeline,
  getNextEvent,
  getDaylightDuration,
  getSunPosition,
  getMoonPosition,
  getMoonIllumination
} from '../utils/astronomy'

/**
 * Hook for comprehensive astronomical data
 */
export function useAstronomy(lat, lng) {
  const [data, setData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [nextEvent, setNextEvent] = useState(null)
  const [daylight, setDaylight] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update all data
  const refresh = useCallback(() => {
    const now = new Date()
    setCurrentTime(now)
    setData(getAstronomicalData(now, lat, lng))
    setTimeline(getDayTimeline(now, lat, lng))
    setNextEvent(getNextEvent(lat, lng))
    setDaylight(getDaylightDuration(now, lat, lng))
  }, [lat, lng])

  // Update positions more frequently (every second)
  const updatePositions = useCallback(() => {
    const now = new Date()
    setCurrentTime(now)

    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        date: now,
        solar: {
          ...prev.solar,
          position: getSunPosition(now, lat, lng)
        },
        lunar: {
          ...prev.lunar,
          position: getMoonPosition(now, lat, lng),
          illumination: getMoonIllumination(now)
        }
      }
    })

    // Update next event
    setNextEvent(getNextEvent(lat, lng))
  }, [lat, lng])

  // Initial load and refresh on location change
  useEffect(() => {
    refresh()
  }, [refresh])

  // Update positions every second
  useEffect(() => {
    const interval = setInterval(updatePositions, 1000)
    return () => clearInterval(interval)
  }, [updatePositions])

  // Full refresh at midnight
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight.getTime() - now.getTime()

    const timeout = setTimeout(() => {
      refresh()
      // Set up daily refresh
      const dailyInterval = setInterval(refresh, 24 * 60 * 60 * 1000)
      return () => clearInterval(dailyInterval)
    }, msUntilMidnight)

    return () => clearTimeout(timeout)
  }, [refresh])

  return {
    data,
    timeline,
    nextEvent,
    daylight,
    currentTime,
    refresh,
    // Convenience accessors
    solar: data?.solar,
    lunar: data?.lunar,
    sunTimes: data?.solar?.times,
    sunPosition: data?.solar?.position,
    moonTimes: data?.lunar?.times,
    moonPosition: data?.lunar?.position,
    moonIllumination: data?.lunar?.illumination
  }
}
