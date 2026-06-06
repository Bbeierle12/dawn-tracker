/**
 * Moon-planting guidance — the Farmers' Almanac's signature gardening tradition,
 * driven by the moon-phase data the app already computes via suncalc.
 *
 * The lunar month is split into four quarters, each favoring a different kind of
 * crop:
 *   Q1 New → First Quarter  (waxing): leafy, above-ground crops grown for foliage
 *   Q2 First Quarter → Full (waxing): above-ground crops that fruit and set seed
 *   Q3 Full → Last Quarter  (waning): root crops, bulbs, transplanting
 *   Q4 Last Quarter → New   (waning): rest — weeding, harvesting, soil work
 *
 * This is folklore, not agronomy, and the module is honest about that in the UI.
 * `phase` is suncalc's 0–1 value (0 = new, 0.25 = first quarter, 0.5 = full).
 */

import { getMoonIllumination } from './astronomy'

const QUARTERS = {
  1: {
    name: 'New → First Quarter',
    trend: 'waxing',
    favors: ['Leafy green', 'Brassica', 'Herb'],
    favorsLabel: 'leafy greens & herbs',
    advice: 'Rising light favors sowing leafy, above-ground crops grown for their foliage.',
  },
  2: {
    name: 'First Quarter → Full',
    trend: 'waxing',
    favors: ['Fruiting vegetable', 'Legume', 'Grain'],
    favorsLabel: 'fruiting & seed crops',
    advice: 'Strong waxing light favors above-ground crops that fruit and set seed — tomatoes, beans, squash, corn.',
  },
  3: {
    name: 'Full → Last Quarter',
    trend: 'waning',
    favors: ['Root', 'Allium'],
    favorsLabel: 'root crops & bulbs',
    advice: 'The waning moon draws energy downward — the traditional window for root crops, bulbs and transplanting.',
  },
  4: {
    name: 'Last Quarter → New',
    trend: 'waning',
    favors: [],
    favorsLabel: 'rest & maintenance',
    advice: 'A resting period — better for weeding, harvesting, pruning and soil work than for sowing.',
  },
}

/** Map a suncalc phase (0–1) to its moon-planting quarter. */
export function classifyMoonQuarter(phase) {
  let quarter
  if (phase < 0.25) quarter = 1
  else if (phase < 0.5) quarter = 2
  else if (phase < 0.75) quarter = 3
  else quarter = 4
  return { quarter, ...QUARTERS[quarter] }
}

/** Current moon-planting guidance for a date. */
export function getMoonPlantingGuidance(date = new Date()) {
  const ill = getMoonIllumination(date)
  return {
    date,
    phase: ill.phase,
    phaseName: ill.phaseName,
    phaseIcon: ill.phaseIcon,
    percentIlluminated: ill.percentIlluminated,
    ...classifyMoonQuarter(ill.phase),
  }
}

/**
 * Collapse the next `days` days into consecutive moon-planting windows.
 * @returns {Array<{quarter, name, favorsLabel, favors, advice, trend, start:Date, end:Date, isCurrent:boolean}>}
 */
export function getUpcomingWindows(fromDate = new Date(), days = 30) {
  const windows = []
  let current = null

  for (let i = 0; i < days; i++) {
    const d = new Date(fromDate)
    d.setDate(d.getDate() + i)
    d.setHours(12, 0, 0, 0)
    const { quarter, name, favorsLabel, favors, advice, trend } = classifyMoonQuarter(getMoonIllumination(d).phase)

    if (current && current.quarter === quarter) {
      current.end = d
    } else {
      if (current) windows.push(current)
      current = { quarter, name, favorsLabel, favors, advice, trend, start: d, end: d, isCurrent: i === 0 }
    }
  }
  if (current) windows.push(current)
  return windows
}

/** Crops from the table whose category is favored by a set of categories. */
export function cropsForCategories(crops, favors) {
  if (!favors?.length) return []
  return crops.filter((c) => favors.includes(c.category))
}
