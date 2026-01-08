import { useEffect, useRef, useCallback } from 'react'
import { useAlarmStore } from '../stores/alarmStore'
import {
  startAlarmSequence,
  stopAllSounds,
  playSound,
  showNotification,
  requestNotificationPermission,
  vibrate
} from '../utils/audio'

/**
 * Hook to manage alarm triggering and dismissal
 */
export function useAlarm(targetTime) {
  const {
    isEnabled,
    isRinging,
    snoozeCount,
    lastSnoozeTime,
    snoozeDurationMinutes,
    triggerAlarm,
    dismissAlarm,
    snooze: storeSnooze
  } = useAlarmStore()

  const cleanupRef = useRef(null)
  const alarmPhaseRef = useRef(0)

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Check for alarm trigger
  useEffect(() => {
    if (!isEnabled || !targetTime || isRinging) return

    const checkAlarm = () => {
      const now = Date.now()
      const target = targetTime.getTime()

      // Check if we should trigger (within 1 second of target)
      if (Math.abs(now - target) < 1000) {
        triggerAlarm()
      }

      // Check for snooze wake-up
      if (lastSnoozeTime) {
        const snoozeEnd = lastSnoozeTime + snoozeDurationMinutes * 60 * 1000
        if (Math.abs(now - snoozeEnd) < 1000) {
          triggerAlarm()
        }
      }
    }

    const interval = setInterval(checkAlarm, 500)
    return () => clearInterval(interval)
  }, [isEnabled, targetTime, isRinging, lastSnoozeTime, snoozeDurationMinutes, triggerAlarm])

  // Handle alarm ringing
  useEffect(() => {
    if (isRinging) {
      // Start alarm sequence
      cleanupRef.current = startAlarmSequence((phase) => {
        alarmPhaseRef.current = phase
      })

      // Show notification
      showNotification('Rise and Shine!', {
        body: "It's the butt crack of dawn in Bakersfield!",
        tag: 'dawn-alarm'
      })

      // Vibrate on mobile
      vibrate([500, 200, 500, 200, 500])

      return () => {
        if (cleanupRef.current) {
          cleanupRef.current()
          cleanupRef.current = null
        }
      }
    } else {
      // Stop all sounds when not ringing
      stopAllSounds()
    }
  }, [isRinging])

  const dismiss = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    playSound('victory')
    dismissAlarm()
  }, [dismissAlarm])

  const snooze = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    return storeSnooze()
  }, [storeSnooze])

  return {
    isRinging,
    isEnabled,
    snoozeCount,
    alarmPhase: alarmPhaseRef.current,
    dismiss,
    snooze
  }
}
