import SunCalc from 'suncalc'

// Bakersfield, CA coordinates
export const BAKERSFIELD = {
  lat: 35.3733,
  lng: -119.0187,
  name: 'Bakersfield, CA'
}

/**
 * Get dawn times for a given date and location
 * @param {Date} date - The date to calculate for
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Dawn times including civil twilight and sunrise
 */
export function getDawnTimes(date = new Date(), lat = BAKERSFIELD.lat, lng = BAKERSFIELD.lng) {
  const times = SunCalc.getTimes(date, lat, lng)

  return {
    // Civil twilight - when sun is 6° below horizon
    // This is the "butt crack" of dawn - earliest usable light
    civilTwilight: times.dawn,

    // Nautical twilight - sun 12° below horizon
    nauticalTwilight: times.nauticalDawn,

    // Official sunrise - when sun disc first appears
    sunrise: times.sunrise,

    // Golden hour start
    goldenHour: times.goldenHourEnd,

    // For display purposes
    solarNoon: times.solarNoon
  }
}

/**
 * Get the next dawn time (civil twilight) from now
 * If today's dawn has passed, return tomorrow's
 */
export function getNextDawn(lat = BAKERSFIELD.lat, lng = BAKERSFIELD.lng) {
  const now = new Date()
  const todayTimes = getDawnTimes(now, lat, lng)

  // If today's civil twilight hasn't passed, use it
  if (todayTimes.civilTwilight > now) {
    return {
      ...todayTimes,
      isToday: true,
      date: now
    }
  }

  // Otherwise, get tomorrow's times
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowTimes = getDawnTimes(tomorrow, lat, lng)

  return {
    ...tomorrowTimes,
    isToday: false,
    date: tomorrow
  }
}

/**
 * Calculate milliseconds until a target time
 */
export function getTimeUntil(targetTime) {
  const now = new Date()
  return Math.max(0, targetTime.getTime() - now.getTime())
}

/**
 * Format milliseconds into hours, minutes, seconds
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    totalSeconds
  }
}

/**
 * Format a Date object to a readable time string
 */
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Calculate night progress (0 = sunset, 1 = dawn)
 */
export function getNightProgress(lat = BAKERSFIELD.lat, lng = BAKERSFIELD.lng) {
  const now = new Date()
  const times = getDawnTimes(now, lat, lng)

  // Get yesterday's sunset for night calculation
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayTimes = SunCalc.getTimes(yesterday, lat, lng)
  const todayTimes = SunCalc.getTimes(now, lat, lng)

  // Determine which sunset to use (yesterday's or today's)
  let nightStart, nightEnd

  if (now < todayTimes.dawn) {
    // Before dawn - night started yesterday
    nightStart = yesterdayTimes.sunset
    nightEnd = todayTimes.dawn
  } else if (now > todayTimes.sunset) {
    // After sunset - night just started
    nightStart = todayTimes.sunset
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    nightEnd = SunCalc.getTimes(tomorrow, lat, lng).dawn
  } else {
    // Daytime
    return 1
  }

  const nightDuration = nightEnd.getTime() - nightStart.getTime()
  const elapsed = now.getTime() - nightStart.getTime()

  return Math.min(1, Math.max(0, elapsed / nightDuration))
}
