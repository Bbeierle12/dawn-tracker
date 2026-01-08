import { useState, useEffect, useRef } from 'react'
import { formatCountdown, getTimeUntil } from '../utils/dawn'

/**
 * Hook for countdown timer to a target time
 */
export function useCountdown(targetTime, onComplete) {
  const [countdown, setCountdown] = useState(() => {
    const ms = targetTime ? getTimeUntil(targetTime) : 0
    return formatCountdown(ms)
  })
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!targetTime) {
      setCountdown(formatCountdown(0))
      return
    }

    const updateCountdown = () => {
      const ms = getTimeUntil(targetTime)
      setCountdown(formatCountdown(ms))

      if (ms <= 0 && !isComplete) {
        setIsComplete(true)
        onCompleteRef.current?.()
      }
    }

    // Initial update
    updateCountdown()

    // Update every second
    intervalRef.current = setInterval(updateCountdown, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [targetTime, isComplete])

  // Reset completion state when target changes
  useEffect(() => {
    if (targetTime && getTimeUntil(targetTime) > 0) {
      setIsComplete(false)
    }
  }, [targetTime])

  return {
    hours: countdown.hours,
    minutes: countdown.minutes,
    seconds: countdown.seconds,
    totalSeconds: countdown.totalSeconds,
    isComplete
  }
}
