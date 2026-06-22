/**
 * Growing Degree Days (GDD) — weather-driven harvest prediction.
 *
 * A flat "days to maturity" assumes an average year. GDD instead accumulates the
 * heat a crop actually receives, so a hot spell pulls the harvest earlier and a
 * cool one pushes it later. We pull recent + forecast daily temps from Open-Meteo
 * and accumulate modified GDD from the sow date.
 *
 *   modified GDD = max(0, (min(Tmax,86) + max(Tmin,base))/2 - base)
 *
 * Tender (warm-season) crops use a 50°F base; hardy (cool-season) crops use 40°F.
 * We don't ship per-crop GDD requirements; instead the target is calibrated from
 * daysToMaturity × a nominal daily GDD, so the *prediction* moves with the weather
 * relative to the flat estimate without needing a lookup table for every crop.
 */

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

const UPPER_CAP_F = 86 // standard modified-GDD ceiling on Tmax
const BASE_WARM_F = 50
const BASE_COOL_F = 40
const NOMINAL_WARM = 18 // nominal daily GDD used to size the target
const NOMINAL_COOL = 11
const PACE_WINDOW_DAYS = 14

/** Fetch recent history + near forecast of daily max/min temps (°F). */
export async function fetchDailyTemps(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    past_days: 92,
    forecast_days: 16,
  })
  const res = await fetch(`${FORECAST_BASE}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch temperatures for GDD: ${res.status}`)
  const data = await res.json()
  return data.daily // { time, temperature_2m_max, temperature_2m_min }
}

function gddBase(crop) {
  return crop.tender ? BASE_WARM_F : BASE_COOL_F
}

function nominalDaily(crop) {
  return crop.tender ? NOMINAL_WARM : NOMINAL_COOL
}

/** Modified GDD for one day. */
function dayGdd(tmax, tmin, base) {
  if (tmax == null || tmin == null) return 0
  const hi = Math.min(tmax, UPPER_CAP_F)
  const lo = Math.max(tmin, base)
  return Math.max(0, (hi + lo) / 2 - base)
}

function isoOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseISO(str) {
  return new Date(`${str}T12:00:00`)
}

function addDays(date, days) {
  const out = new Date(date.getTime())
  out.setDate(out.getDate() + days)
  return out
}

/**
 * Compute GDD progress and a weather-adjusted harvest prediction for a planting.
 *
 * @param {{time:string[], temperature_2m_max:number[], temperature_2m_min:number[]}} dailyTemps
 * @param {string} sowDate - 'YYYY-MM-DD'
 * @param {{daysToMaturity:number, tender:boolean}} crop
 * @param {Date} [today]
 * @returns {null | {
 *   accumulatedGDD:number, targetGDD:number, progress:number,
 *   dailyPace:number, predictedHarvestDate:Date, deltaDays:number
 * }}
 */
export function computeGdd(dailyTemps, sowDate, crop, today = new Date()) {
  if (!dailyTemps?.time?.length || !sowDate || !crop?.daysToMaturity) return null

  const base = gddBase(crop)
  const targetGDD = crop.daysToMaturity * nominalDaily(crop)
  const todayStr = isoOf(today)

  const series = dailyTemps.time.map((t, i) => ({
    dateStr: t,
    gdd: dayGdd(dailyTemps.temperature_2m_max[i], dailyTemps.temperature_2m_min[i], base),
  }))

  // Accumulate from sow date through today.
  let accumulatedGDD = 0
  for (const d of series) {
    if (d.dateStr >= sowDate && d.dateStr <= todayStr) accumulatedGDD += d.gdd
  }

  // Recent daily pace (last N observed days up to today).
  const observed = series.filter((d) => d.dateStr <= todayStr)
  const recent = observed.slice(-PACE_WINDOW_DAYS)
  const dailyPace = recent.length
    ? recent.reduce((a, b) => a + b.gdd, 0) / recent.length
    : nominalDaily(crop)

  const flatHarvest = addDays(parseISO(sowDate), crop.daysToMaturity)

  // Planting hasn't started accumulating yet (future sow date): fall back to flat.
  if (sowDate > todayStr) {
    return {
      accumulatedGDD: 0,
      targetGDD,
      progress: 0,
      dailyPace,
      predictedHarvestDate: flatHarvest,
      deltaDays: 0,
    }
  }

  // Project forward to the target using forecast days, then extrapolate at pace.
  let predictedHarvestDate
  if (accumulatedGDD >= targetGDD) {
    predictedHarvestDate = today
  } else {
    const future = series.filter((d) => d.dateStr > todayStr)
    let cum = accumulatedGDD
    let hit = null
    for (const d of future) {
      cum += d.gdd
      if (cum >= targetGDD) { hit = parseISO(d.dateStr); break }
    }
    if (hit) {
      predictedHarvestDate = hit
    } else {
      const remaining = targetGDD - cum
      const pace = dailyPace > 0 ? dailyPace : nominalDaily(crop)
      const lastDate = future.length ? parseISO(future[future.length - 1].dateStr) : today
      predictedHarvestDate = addDays(lastDate, Math.ceil(remaining / pace))
    }
  }

  const deltaDays = Math.round((flatHarvest.getTime() - predictedHarvestDate.getTime()) / 86400000)

  return {
    accumulatedGDD,
    targetGDD,
    progress: targetGDD > 0 ? accumulatedGDD / targetGDD : 0,
    dailyPace,
    predictedHarvestDate,
    deltaDays,
  }
}
