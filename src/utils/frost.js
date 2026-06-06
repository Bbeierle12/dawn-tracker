/**
 * Frost-date derivation from Open-Meteo's historical weather archive.
 *
 * The brand almanacs have no public API, so instead of looking frost dates up we
 * DERIVE them the same way NOAA does: pull ~30 years of daily minimum temperatures
 * for a location and find, per year, the average last spring freeze and first fall
 * freeze (days at or below 32°F). Free, no API key, works from lat/lng anywhere.
 *
 * Mirrors the fetch/process split used in utils/atmosphere.js.
 */

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive'

const FREEZE_THRESHOLD_F = 32

/** Day-of-year (1-366) for a calendar month/day, normalized to a non-leap frame. */
function dayOfYear(month, day) {
  const start = Date.UTC(2001, 0, 1)
  const d = Date.UTC(2001, month - 1, day)
  return Math.round((d - start) / 86400000) + 1
}

/** Inverse of dayOfYear: average day-of-year back to a 'MM-DD' string. */
function dayOfYearToMMDD(doy) {
  const d = new Date(Date.UTC(2001, 0, 1) + (Math.round(doy) - 1) * 86400000)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

/**
 * Fetch daily minimum temperatures (°F) for the most recent `years` complete
 * calendar years. One request returns the whole series.
 */
export async function fetchHistoricalMinTemps(lat, lng, years = 30, endYear = new Date().getFullYear() - 1) {
  const startYear = endYear - years + 1
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
  })

  const response = await fetch(`${ARCHIVE_BASE}?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch historical temperatures: ${response.status}`)
  }
  return response.json()
}

/**
 * Derive average frost dates from a daily-minimum-temperature series.
 *
 * @param {{ time: string[], temperature_2m_min: number[] }} daily - Open-Meteo `daily` block
 * @returns {{ lastSpringFrost: string|null, firstFallFrost: string|null,
 *             years: number, frostFree: boolean, computedAt: string,
 *             thresholdF: number }}
 *   Frost dates are 'MM-DD' strings, or null for a frost-free location.
 */
export function deriveFrostDates(daily) {
  const times = daily?.time ?? []
  const mins = daily?.temperature_2m_min ?? []

  // Per-year latest spring freeze and earliest fall freeze, as day-of-year.
  const springByYear = new Map() // year -> max DOY of a Jan–Jun freeze
  const fallByYear = new Map()   // year -> min DOY of a Jul–Dec freeze
  const yearsSeen = new Set()

  for (let i = 0; i < times.length; i++) {
    const temp = mins[i]
    if (temp == null) continue
    const [year, month, day] = times[i].split('-').map(Number)
    yearsSeen.add(year)
    if (temp > FREEZE_THRESHOLD_F) continue

    const doy = dayOfYear(month, day)
    if (month <= 6) {
      // Spring: track the LATEST freeze.
      const prev = springByYear.get(year)
      if (prev == null || doy > prev) springByYear.set(year, doy)
    } else {
      // Fall: track the EARLIEST freeze.
      const prev = fallByYear.get(year)
      if (prev == null || doy < prev) fallByYear.set(year, doy)
    }
  }

  const avg = (values) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

  const springAvg = avg([...springByYear.values()])
  const fallAvg = avg([...fallByYear.values()])

  return {
    lastSpringFrost: springAvg == null ? null : dayOfYearToMMDD(springAvg),
    firstFallFrost: fallAvg == null ? null : dayOfYearToMMDD(fallAvg),
    years: yearsSeen.size,
    frostFree: springAvg == null && fallAvg == null,
    thresholdF: FREEZE_THRESHOLD_F,
    computedAt: new Date().toISOString(),
  }
}

/** Convenience: fetch the history and derive frost dates in one call. */
export async function deriveFrostDatesForLocation(lat, lng, years = 30) {
  const raw = await fetchHistoricalMinTemps(lat, lng, years)
  return deriveFrostDates(raw.daily)
}
