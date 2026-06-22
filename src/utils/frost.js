/**
 * Frost-date derivation from Open-Meteo's historical weather archive.
 *
 * The brand almanacs have no public API, so instead of looking frost dates up we
 * DERIVE them the way NOAA does: pull ~30 years of daily minimum temperatures for
 * a location and find, per year, the last spring freeze and first fall freeze
 * (days at or below 32°F). Free, no API key, works from lat/lng anywhere.
 *
 * Hemisphere-agnostic: freezes are split into "spring" (approaching summer) and
 * "fall" (after summer) by their offset from MIDSUMMER, so the southern hemisphere
 * (where the growing season straddles the new year) derives correctly too.
 *
 * Beyond the mean, we expose 10th/50th/90th percentile dates so callers can plant
 * on a RISK-adjusted date rather than the average — the mean last-frost is later
 * than ~half of years, so planting on it under-protects.
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

/** Wrap a day-of-year into the 1..365 range. */
function normalizeDOY(doy) {
  return ((Math.round(doy) - 1) % 365 + 365) % 365 + 1
}

/** Day-of-year back to a 'MM-DD' string. */
function dayOfYearToMMDD(doy) {
  const d = new Date(Date.UTC(2001, 0, 1) + (normalizeDOY(doy) - 1) * 86400000)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${mm}-${dd}`
}

// Standard frost-season split (matches NOAA's definition): the last freeze in the
// warming half of the year is the "last spring frost"; the first freeze in the
// cooling half is the "first fall frost". We shift the calendar by a half-year in
// the southern hemisphere — where the growing season straddles Jan 1 — so the same
// logic applies in a contiguous frame. The split sits at ~Aug 1 (post-midsummer),
// which keeps deep-winter (e.g. early-January) freezes on the spring side, as the
// gardener's "last frost before planting" definition requires.
const SPRING_FALL_SPLIT = 213 // ~Aug 1 in the (shifted) frame

function hemisphereShift(lat) {
  return lat < 0 ? 182 : 0
}
function toSeasonDoy(doy, shift) {
  return ((doy - 1 + shift) % 365) + 1
}
function fromSeasonDoy(seasonDoy, shift) {
  return ((Math.round(seasonDoy) - 1 - shift) % 365 + 365) % 365 + 1
}

/** Linear-interpolated percentile of a sorted ascending array. */
function percentile(sorted, p) {
  if (!sorted.length) return null
  if (sorted.length === 1) return sorted[0]
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
}

function stddev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1))
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
 * Derive frost dates from a daily-minimum-temperature series.
 *
 * @param {{ time: string[], temperature_2m_min: number[] }} daily - Open-Meteo `daily` block
 * @param {number} [lat=45] - latitude; sign selects the hemisphere
 * @returns {{
 *   lastSpringFrost: string|null, firstFallFrost: string|null,   // 'MM-DD', mean
 *   spring: {mean,p10,p50,p90}|null, fall: {mean,p10,p50,p90}|null, // 'MM-DD' each
 *   std: { springDays: number, fallDays: number },
 *   years: number, frostFree: boolean, hemisphere: 'N'|'S',
 *   thresholdF: number, computedAt: string
 * }}
 *   p90 spring = late tail (conservative last-frost); p10 fall = early tail
 *   (conservative first-frost).
 */
export function deriveFrostDates(daily, lat = 45) {
  const times = daily?.time ?? []
  const mins = daily?.temperature_2m_min ?? []
  const shift = hemisphereShift(lat)

  // Per-year season-day-of-year of the latest spring freeze and earliest fall freeze.
  const springByYear = new Map() // year -> max season-doy below the split (latest spring)
  const fallByYear = new Map() //   year -> min season-doy at/after the split (earliest fall)
  const yearsSeen = new Set()

  for (let i = 0; i < times.length; i++) {
    const temp = mins[i]
    if (temp == null) continue
    const [year, month, day] = times[i].split('-').map(Number)
    yearsSeen.add(year)
    if (temp > FREEZE_THRESHOLD_F) continue

    const sd = toSeasonDoy(dayOfYear(month, day), shift)
    if (sd < SPRING_FALL_SPLIT) {
      const prev = springByYear.get(year)
      if (prev == null || sd > prev) springByYear.set(year, sd) // latest spring
    } else {
      const prev = fallByYear.get(year)
      if (prev == null || sd < prev) fallByYear.set(year, sd) // earliest fall
    }
  }

  const springOffs = [...springByYear.values()].sort((a, b) => a - b)
  const fallOffs = [...fallByYear.values()].sort((a, b) => a - b)
  const toDate = (sd) => (sd == null ? null : dayOfYearToMMDD(fromSeasonDoy(sd, shift)))

  const spring = springOffs.length
    ? {
        mean: toDate(mean(springOffs)),
        p10: toDate(percentile(springOffs, 10)),
        p50: toDate(percentile(springOffs, 50)),
        p90: toDate(percentile(springOffs, 90)),
      }
    : null
  const fall = fallOffs.length
    ? {
        mean: toDate(mean(fallOffs)),
        p10: toDate(percentile(fallOffs, 10)),
        p50: toDate(percentile(fallOffs, 50)),
        p90: toDate(percentile(fallOffs, 90)),
      }
    : null

  return {
    lastSpringFrost: spring ? spring.mean : null,
    firstFallFrost: fall ? fall.mean : null,
    spring,
    fall,
    std: { springDays: stddev(springOffs), fallDays: stddev(fallOffs) },
    years: yearsSeen.size,
    frostFree: spring == null && fall == null,
    hemisphere: lat < 0 ? 'S' : 'N',
    thresholdF: FREEZE_THRESHOLD_F,
    computedAt: new Date().toISOString(),
  }
}

/**
 * Pick the frost dates a planner should use for a given risk appetite.
 *   conservative — plant late / harvest early (p90 spring, p10 fall): safest
 *   moderate     — the median (p50)
 *   aggressive   — push the season (p10 spring, p90 fall): riskiest
 * Falls back to the mean fields when percentiles are unavailable.
 */
export function pickFrostDates(frostDates, risk = 'moderate') {
  if (!frostDates) return null
  const { spring, fall } = frostDates
  if (!spring && !fall) {
    return { lastSpringFrost: frostDates.lastSpringFrost, firstFallFrost: frostDates.firstFallFrost, frostFree: frostDates.frostFree }
  }
  const pick = (band, conservativeKey, aggressiveKey) => {
    if (!band) return null
    if (risk === 'conservative') return band[conservativeKey]
    if (risk === 'aggressive') return band[aggressiveKey]
    return band.p50
  }
  return {
    lastSpringFrost: pick(spring, 'p90', 'p10'),
    firstFallFrost: pick(fall, 'p10', 'p90'),
    frostFree: frostDates.frostFree,
    risk,
  }
}

/** Convenience: fetch the history and derive frost dates in one call. */
export async function deriveFrostDatesForLocation(lat, lng, years = 30) {
  const raw = await fetchHistoricalMinTemps(lat, lng, years)
  return deriveFrostDates(raw.daily, lat)
}
