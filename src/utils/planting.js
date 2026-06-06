/**
 * Planting calendar engine — pure functions, no I/O.
 *
 * Given derived frost dates (from utils/frost.js) and the crop table (data/crops.js),
 * decide for each crop whether it can be planted now, soon, or later, and over what
 * date range. All windows in the crop table are frost-relative; this module turns
 * them into concrete dates for a given year and classifies them against today.
 *
 * For frost-tender crops a maturity guard trims the late end of every window: a
 * planting is only viable if it can reach harvest (daysToMaturity) at least
 * MATURITY_BUFFER_DAYS before the first fall frost.
 */

const MATURITY_BUFFER_DAYS = 14
const SOON_DAYS = 42 // "coming soon" horizon (~6 weeks)

// ---- date helpers (local noon to stay clear of DST/UTC boundary flips) ----

function mmddToDate(mmdd, year) {
  if (!mmdd) return null
  const [m, d] = mmdd.split('-').map(Number)
  return new Date(year, m - 1, d, 12, 0, 0, 0)
}

function addDays(date, days) {
  const out = new Date(date.getTime())
  out.setDate(out.getDate() + days)
  return out
}

function addWeeks(date, weeks) {
  return addDays(date, weeks * 7)
}

function noon(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
}

function daysBetween(from, to) {
  return Math.round((noon(to).getTime() - noon(from).getTime()) / 86400000)
}

// ---- window computation ----

function refDateFor(window, frostDates, year) {
  if (window.ref === 'FFF') return mmddToDate(frostDates.firstFallFrost, year)
  return mmddToDate(frostDates.lastSpringFrost, year)
}

/** Latest sow date for a tender crop to mature before first fall frost. */
function maturityLatestSowDate(crop, frostDates, year) {
  const fff = mmddToDate(frostDates.firstFallFrost, year)
  if (!fff) return null // frost-free: no late limit
  return addDays(fff, -(crop.daysToMaturity + MATURITY_BUFFER_DAYS))
}

/**
 * Concrete [start, end] dates for one window in a given year, after applying the
 * tender-crop maturity guard. Returns null if the window's frost anchor is unknown.
 * A returned window with start > end means it is not viable that year.
 */
function effectiveWindow(crop, window, frostDates, year) {
  const ref = refDateFor(window, frostDates, year)
  if (!ref) return null

  let start = addWeeks(ref, window.start)
  let end = addWeeks(ref, window.end)

  if (crop.tender) {
    const latest = maturityLatestSowDate(crop, frostDates, year)
    if (latest && latest.getTime() < end.getTime()) end = latest
  }

  return { method: window.method, season: window.season, start, end }
}

/** All viable (start <= end) windows for a crop in a given year. */
function viableWindows(crop, frostDates, year) {
  return crop.windows
    .map((w) => effectiveWindow(crop, w, frostDates, year))
    .filter((w) => w && w.start.getTime() <= w.end.getTime())
}

/**
 * Classify a single crop against `today`.
 * @returns {{
 *   crop: object, status: 'now'|'soon'|'later'|'next-year',
 *   method: string, season?: string,
 *   windowStart: Date, windowEnd: Date,
 *   daysUntilStart: number, daysLeft: number|null
 * }}
 */
export function classifyCrop(crop, frostDates, today = new Date()) {
  // Frost-free climate: nothing to time against — plantable year-round.
  if (frostDates?.frostFree) {
    const w = crop.windows[0]
    return {
      crop,
      status: 'now',
      method: w.method,
      season: w.season,
      windowStart: null,
      windowEnd: null,
      daysUntilStart: 0,
      daysLeft: null,
      frostFree: true,
    }
  }

  const t = noon(today)
  const year = t.getFullYear()
  const windows = viableWindows(crop, frostDates, year)

  // Active window (today within range) → "now". Prefer the one ending soonest.
  const active = windows
    .filter((w) => w.start.getTime() <= t.getTime() && t.getTime() <= w.end.getTime())
    .sort((a, b) => a.end - b.end)[0]
  if (active) {
    return {
      crop,
      status: 'now',
      method: active.method,
      season: active.season,
      windowStart: active.start,
      windowEnd: active.end,
      daysUntilStart: 0,
      daysLeft: daysBetween(t, active.end),
    }
  }

  // Next upcoming window this year.
  const upcoming = windows
    .filter((w) => w.start.getTime() > t.getTime())
    .sort((a, b) => a.start - b.start)[0]
  if (upcoming) {
    const daysUntilStart = daysBetween(t, upcoming.start)
    return {
      crop,
      status: daysUntilStart <= SOON_DAYS ? 'soon' : 'later',
      method: upcoming.method,
      season: upcoming.season,
      windowStart: upcoming.start,
      windowEnd: upcoming.end,
      daysUntilStart,
      daysLeft: null,
    }
  }

  // All windows for this year are past → look at next year's earliest window.
  const nextYear = viableWindows(crop, frostDates, year + 1).sort((a, b) => a.start - b.start)[0]
  if (nextYear) {
    return {
      crop,
      status: 'next-year',
      method: nextYear.method,
      season: nextYear.season,
      windowStart: nextYear.start,
      windowEnd: nextYear.end,
      daysUntilStart: daysBetween(t, nextYear.start),
      daysLeft: null,
    }
  }

  // No viable window at all (e.g. season too short for this crop here).
  return {
    crop,
    status: 'next-year',
    method: crop.windows[0].method,
    season: crop.windows[0].season,
    windowStart: null,
    windowEnd: null,
    daysUntilStart: Infinity,
    daysLeft: null,
  }
}

/**
 * Build the full planting calendar, bucketed for display.
 * @returns {{ plantNow: object[], comingSoon: object[], later: object[] }}
 */
export function getPlantingCalendar(crops, frostDates, today = new Date()) {
  const classified = crops.map((c) => classifyCrop(c, frostDates, today))

  const plantNow = classified
    .filter((c) => c.status === 'now')
    .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))

  const comingSoon = classified
    .filter((c) => c.status === 'soon')
    .sort((a, b) => a.daysUntilStart - b.daysUntilStart)

  const later = classified
    .filter((c) => c.status === 'later' || c.status === 'next-year')
    .sort((a, b) => a.daysUntilStart - b.daysUntilStart)

  return { plantNow, comingSoon, later }
}

// ---- display helpers (used by the view) ----

const METHOD_LABELS = {
  'direct-sow': 'Direct sow',
  'start-indoors': 'Start indoors',
  transplant: 'Transplant',
  'plant-cloves': 'Plant cloves',
}

export function methodLabel(method) {
  return METHOD_LABELS[method] || method
}

export function formatMonthDay(date) {
  if (!date) return '--'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatWindowRange(start, end) {
  if (!start || !end) return 'Year-round'
  return `${formatMonthDay(start)} – ${formatMonthDay(end)}`
}
