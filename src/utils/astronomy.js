import SunCalc from 'suncalc'

// Default location - Bakersfield, CA
export const DEFAULT_LOCATION = {
  lat: 35.3733,
  lng: -119.0187,
  name: 'Bakersfield, CA',
  timezone: 'America/Los_Angeles'
}

// Moon phase names - boundaries adjusted to center quarters at 0.25/0.75
// where illumination is actually ~50%
const MOON_PHASES = [
  { name: 'New Moon', icon: '🌑', range: [0, 0.03] },
  { name: 'Waxing Crescent', icon: '🌒', range: [0.03, 0.22] },
  { name: 'First Quarter', icon: '🌓', range: [0.22, 0.28] },
  { name: 'Waxing Gibbous', icon: '🌔', range: [0.28, 0.47] },
  { name: 'Full Moon', icon: '🌕', range: [0.47, 0.53] },
  { name: 'Waning Gibbous', icon: '🌖', range: [0.53, 0.72] },
  { name: 'Last Quarter', icon: '🌗', range: [0.72, 0.78] },
  { name: 'Waning Crescent', icon: '🌘', range: [0.78, 0.97] }
]

/**
 * Get all solar events for a given date and location
 */
export function getSolarTimes(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const times = SunCalc.getTimes(date, lat, lng)

  return {
    // Twilight phases (morning)
    astronomicalDawn: times.nightEnd,      // Sun 18° below horizon
    nauticalDawn: times.nauticalDawn,      // Sun 12° below horizon
    civilDawn: times.dawn,                 // Sun 6° below horizon

    // Main events
    sunrise: times.sunrise,                // Sun top edge touches horizon
    sunriseEnd: times.sunriseEnd,          // Sun fully above horizon
    solarNoon: times.solarNoon,            // Sun at highest point
    sunsetStart: times.sunsetStart,        // Sun starts touching horizon
    sunset: times.sunset,                  // Sun fully below horizon

    // Twilight phases (evening)
    civilDusk: times.dusk,                 // Sun 6° below horizon
    nauticalDusk: times.nauticalDusk,      // Sun 12° below horizon
    astronomicalDusk: times.night,         // Sun 18° below horizon

    // Golden hours (best photography light)
    goldenHourMorningStart: times.sunrise,
    goldenHourMorningEnd: times.goldenHourEnd,
    goldenHourEveningStart: times.goldenHour,
    goldenHourEveningEnd: times.sunset,

    // Nadir (sun at lowest point)
    nadir: times.nadir
  }
}

/**
 * Get current sun position
 */
export function getSunPosition(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const position = SunCalc.getPosition(date, lat, lng)

  return {
    altitude: position.altitude * (180 / Math.PI),  // Convert to degrees
    azimuth: (position.azimuth * (180 / Math.PI) + 180) % 360,  // Convert to degrees, 0 = North
    altitudeRad: position.altitude,
    azimuthRad: position.azimuth
  }
}

/**
 * Get lunar times for a given date and location
 */
export function getLunarTimes(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const times = SunCalc.getMoonTimes(date, lat, lng)

  return {
    moonrise: times.rise || null,
    moonset: times.set || null,
    alwaysUp: times.alwaysUp || false,
    alwaysDown: times.alwaysDown || false
  }
}

/**
 * Get current moon position
 */
export function getMoonPosition(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const position = SunCalc.getMoonPosition(date, lat, lng)

  return {
    altitude: position.altitude * (180 / Math.PI),
    azimuth: (position.azimuth * (180 / Math.PI) + 180) % 360,
    distance: position.distance,  // km from Earth center
    parallacticAngle: position.parallacticAngle * (180 / Math.PI)
  }
}

/**
 * Get moon illumination and phase
 */
export function getMoonIllumination(date = new Date()) {
  const illumination = SunCalc.getMoonIllumination(date)

  // Find phase name
  let phase = MOON_PHASES[0]
  for (const p of MOON_PHASES) {
    if (illumination.phase >= p.range[0] && illumination.phase < p.range[1]) {
      phase = p
      break
    }
  }
  // Handle wrap-around for new moon
  if (illumination.phase >= 0.97) {
    phase = MOON_PHASES[0]
  }

  return {
    fraction: illumination.fraction,       // 0-1, illuminated fraction
    phase: illumination.phase,             // 0-1, moon phase (0=new, 0.5=full)
    angle: illumination.angle,             // Midpoint angle in radians
    phaseName: phase.name,
    phaseIcon: phase.icon,
    percentIlluminated: Math.round(illumination.fraction * 100)
  }
}

/**
 * Get comprehensive astronomical data for a date
 */
export function getAstronomicalData(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  return {
    date,
    location: { lat, lng },
    solar: {
      times: getSolarTimes(date, lat, lng),
      position: getSunPosition(date, lat, lng)
    },
    lunar: {
      times: getLunarTimes(date, lat, lng),
      position: getMoonPosition(date, lat, lng),
      illumination: getMoonIllumination(date)
    }
  }
}

/**
 * Generate timeline events for a 24-hour period
 */
export function getDayTimeline(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const solar = getSolarTimes(date, lat, lng)
  const lunar = getLunarTimes(date, lat, lng)
  const moonInfo = getMoonIllumination(date)

  const events = []

  // Solar events
  const solarEvents = [
    { time: solar.astronomicalDawn, label: 'Astronomical Dawn', type: 'solar', description: 'Sun 18° below horizon' },
    { time: solar.nauticalDawn, label: 'Nautical Dawn', type: 'solar', description: 'Sun 12° below horizon' },
    { time: solar.civilDawn, label: 'Civil Dawn', type: 'solar', description: 'Sun 6° below horizon' },
    { time: solar.sunrise, label: 'Sunrise', type: 'solar', description: 'Sun top edge at horizon', major: true },
    { time: solar.goldenHourMorningEnd, label: 'Golden Hour Ends', type: 'solar', description: 'Morning golden light ends' },
    { time: solar.solarNoon, label: 'Solar Noon', type: 'solar', description: 'Sun at highest point', major: true },
    { time: solar.goldenHourEveningStart, label: 'Golden Hour Begins', type: 'solar', description: 'Evening golden light starts' },
    { time: solar.sunset, label: 'Sunset', type: 'solar', description: 'Sun fully below horizon', major: true },
    { time: solar.civilDusk, label: 'Civil Dusk', type: 'solar', description: 'Sun 6° below horizon' },
    { time: solar.nauticalDusk, label: 'Nautical Dusk', type: 'solar', description: 'Sun 12° below horizon' },
    { time: solar.astronomicalDusk, label: 'Astronomical Dusk', type: 'solar', description: 'Sun 18° below horizon' }
  ]

  // Lunar events
  if (lunar.moonrise) {
    events.push({
      time: lunar.moonrise,
      label: 'Moonrise',
      type: 'lunar',
      description: `${moonInfo.phaseName} (${moonInfo.percentIlluminated}% illuminated)`,
      major: true,
      icon: moonInfo.phaseIcon
    })
  }

  if (lunar.moonset) {
    events.push({
      time: lunar.moonset,
      label: 'Moonset',
      type: 'lunar',
      description: `${moonInfo.phaseName}`,
      major: true,
      icon: moonInfo.phaseIcon
    })
  }

  // Add valid solar events
  solarEvents.forEach(event => {
    if (event.time && !isNaN(event.time.getTime())) {
      events.push(event)
    }
  })

  // Sort by time
  events.sort((a, b) => a.time.getTime() - b.time.getTime())

  return events
}

/**
 * Get next upcoming astronomical event
 */
export function getNextEvent(lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const now = new Date()
  const todayEvents = getDayTimeline(now, lat, lng)

  // Find next event today
  for (const event of todayEvents) {
    if (event.time > now) {
      return event
    }
  }

  // If no events remaining today, get first event tomorrow
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowEvents = getDayTimeline(tomorrow, lat, lng)

  return tomorrowEvents[0] || null
}

/**
 * Calculate daylight duration
 */
export function getDaylightDuration(date = new Date(), lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const times = getSolarTimes(date, lat, lng)

  if (!times.sunrise || !times.sunset) {
    return null
  }

  const durationMs = times.sunset.getTime() - times.sunrise.getTime()
  const hours = Math.floor(durationMs / (1000 * 60 * 60))
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours,
    minutes,
    totalMinutes: Math.floor(durationMs / (1000 * 60)),
    formatted: `${hours}h ${minutes}m`
  }
}

/**
 * Format time for display
 */
export function formatTime(date, options = {}) {
  if (!date || isNaN(date.getTime())) return '--:--'

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  })
}

/**
 * Format time with seconds
 */
export function formatTimeWithSeconds(date) {
  if (!date || isNaN(date.getTime())) return '--:--:--'

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Calculate time until a target
 */
export function getTimeUntil(targetTime) {
  if (!targetTime) return 0
  const now = new Date()
  return Math.max(0, targetTime.getTime() - now.getTime())
}

/**
 * Format milliseconds as countdown string
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
    totalSeconds,
    formatted: `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
}

/**
 * Get current period of day
 */
export function getCurrentPeriod(lat = DEFAULT_LOCATION.lat, lng = DEFAULT_LOCATION.lng) {
  const now = new Date()
  const times = getSolarTimes(now, lat, lng)
  const sunPos = getSunPosition(now, lat, lng)

  if (sunPos.altitude < -18) return { name: 'Night', description: 'Astronomical night' }
  if (sunPos.altitude < -12) return { name: 'Astronomical Twilight', description: 'Stars visible' }
  if (sunPos.altitude < -6) return { name: 'Nautical Twilight', description: 'Horizon visible' }
  if (sunPos.altitude < 0) return { name: 'Civil Twilight', description: 'Sufficient light for activities' }
  if (now < times.goldenHourMorningEnd) return { name: 'Golden Hour', description: 'Warm morning light' }
  if (now > times.goldenHourEveningStart) return { name: 'Golden Hour', description: 'Warm evening light' }
  return { name: 'Daylight', description: 'Full daylight' }
}
