/**
 * Atmosphere utilities - Open-Meteo API integration for observation conditions
 */

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast'

/**
 * Fetch atmospheric data from Open-Meteo
 */
export async function fetchAtmosphericData(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current: [
      'cloud_cover',
      'visibility',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code'
    ].join(','),
    hourly: [
      'cloud_cover',
      'cloud_cover_low',
      'cloud_cover_mid',
      'cloud_cover_high',
      'visibility',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_probability',
      'weather_code'
    ].join(','),
    timezone: 'auto',
    forecast_days: 2
  })

  const response = await fetch(`${OPEN_METEO_BASE}?${params}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch atmospheric data: ${response.status}`)
  }

  return response.json()
}

/**
 * Calculate observation score (0-100)
 * Higher = better conditions for observation
 */
export function calculateObservationScore(cloudCover, visibility, humidity) {
  // Cloud cover: 0% = 40 points, 100% = 0 points
  const cloudScore = Math.max(0, 40 - (cloudCover * 0.4))

  // Visibility: 20+ km = 35 points, 0 km = 0 points (visibility in meters)
  const visibilityKm = visibility / 1000
  const visibilityScore = Math.min(35, visibilityKm * 1.75)

  // Humidity: <40% = 25 points, >90% = 0 points
  let humidityScore = 25
  if (humidity > 40) {
    humidityScore = Math.max(0, 25 - ((humidity - 40) * 0.5))
  }

  return Math.round(cloudScore + visibilityScore + humidityScore)
}

/**
 * Get observation rating from score
 */
export function getObservationRating(score) {
  if (score >= 85) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' }
  if (score >= 70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  if (score >= 50) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  if (score >= 30) return { label: 'Poor', color: 'text-orange-400', bg: 'bg-orange-500/20' }
  return { label: 'Bad', color: 'text-red-400', bg: 'bg-red-500/20' }
}

/**
 * Get transparency rating based on visibility and humidity
 */
export function getTransparencyRating(visibility, humidity) {
  const visibilityKm = visibility / 1000

  if (visibilityKm >= 20 && humidity < 50) return { label: 'Excellent', color: 'text-green-400' }
  if (visibilityKm >= 15 && humidity < 60) return { label: 'Good', color: 'text-blue-400' }
  if (visibilityKm >= 10 && humidity < 75) return { label: 'Fair', color: 'text-yellow-400' }
  return { label: 'Poor', color: 'text-red-400' }
}

/**
 * Find the best viewing window in the next 24 hours
 */
export function findBestViewingWindow(hourlyData) {
  if (!hourlyData || !hourlyData.time) return null

  const now = new Date()
  let bestWindow = null
  let bestScore = -1
  let windowStart = null
  let windowEnd = null
  let currentWindowStart = null

  for (let i = 0; i < hourlyData.time.length && i < 24; i++) {
    const time = new Date(hourlyData.time[i])
    if (time < now) continue

    const score = calculateObservationScore(
      hourlyData.cloud_cover[i],
      hourlyData.visibility[i],
      hourlyData.relative_humidity_2m[i]
    )

    // Track continuous good windows (score >= 70)
    if (score >= 70) {
      if (!currentWindowStart) {
        currentWindowStart = time
      }
      windowEnd = time

      if (score > bestScore) {
        bestScore = score
        windowStart = currentWindowStart
      }
    } else {
      currentWindowStart = null
    }
  }

  if (bestScore >= 70 && windowStart) {
    return {
      start: windowStart,
      end: windowEnd,
      score: bestScore
    }
  }

  return null
}

/**
 * Get weather condition description from WMO code
 */
export function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
  }

  return descriptions[code] || 'Unknown'
}

/**
 * Process raw API data into usable format
 */
export function processAtmosphericData(rawData) {
  const current = rawData.current
  const hourly = rawData.hourly

  const observationScore = calculateObservationScore(
    current.cloud_cover,
    current.visibility,
    current.relative_humidity_2m
  )

  const bestWindow = findBestViewingWindow(hourly)

  // Get hourly forecast for next 24 hours
  const now = new Date()
  const hourlyForecast = []
  for (let i = 0; i < hourly.time.length && hourlyForecast.length < 24; i++) {
    const time = new Date(hourly.time[i])
    if (time >= now) {
      hourlyForecast.push({
        time,
        cloudCover: hourly.cloud_cover[i],
        cloudCoverLow: hourly.cloud_cover_low[i],
        cloudCoverMid: hourly.cloud_cover_mid[i],
        cloudCoverHigh: hourly.cloud_cover_high[i],
        visibility: hourly.visibility[i],
        humidity: hourly.relative_humidity_2m[i],
        dewPoint: hourly.dew_point_2m[i],
        temperature: hourly.apparent_temperature[i],
        precipProbability: hourly.precipitation_probability[i],
        weatherCode: hourly.weather_code[i],
        score: calculateObservationScore(
          hourly.cloud_cover[i],
          hourly.visibility[i],
          hourly.relative_humidity_2m[i]
        )
      })
    }
  }

  return {
    current: {
      cloudCover: current.cloud_cover,
      visibility: current.visibility,
      humidity: current.relative_humidity_2m,
      temperature: current.apparent_temperature,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      weatherDescription: getWeatherDescription(current.weather_code),
      observationScore,
      rating: getObservationRating(observationScore),
      transparency: getTransparencyRating(current.visibility, current.relative_humidity_2m)
    },
    hourlyForecast,
    bestWindow,
    timestamp: new Date()
  }
}
