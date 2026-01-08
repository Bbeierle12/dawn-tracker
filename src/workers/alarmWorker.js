/**
 * Web Worker for background alarm timing
 * This keeps the alarm running even when the tab is backgrounded
 */

let alarmTime = null
let checkInterval = null

self.onmessage = function(e) {
  const { type, data } = e.data

  switch (type) {
    case 'SET_ALARM':
      alarmTime = data.time
      startChecking()
      break

    case 'CLEAR_ALARM':
      alarmTime = null
      stopChecking()
      break

    case 'GET_STATUS':
      self.postMessage({
        type: 'STATUS',
        data: {
          alarmTime,
          isActive: checkInterval !== null
        }
      })
      break
  }
}

function startChecking() {
  stopChecking() // Clear any existing interval

  checkInterval = setInterval(() => {
    if (alarmTime) {
      const now = Date.now()
      const target = new Date(alarmTime).getTime()

      // Check if within 1 second of target
      if (Math.abs(now - target) < 1000) {
        self.postMessage({ type: 'ALARM_TRIGGER' })
        // Keep checking for snooze scenarios
      }

      // Also send countdown update
      const remaining = Math.max(0, target - now)
      self.postMessage({
        type: 'COUNTDOWN_UPDATE',
        data: { remaining }
      })
    }
  }, 500)
}

function stopChecking() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}
