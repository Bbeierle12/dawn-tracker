import { describe, it, expect } from 'vitest'
import { classifyCrop, getPlantingCalendar } from '../planting'
import { CROPS } from '../../data/crops'

const crop = (id) => CROPS.find((c) => c.id === id)

// Bakersfield-like frost dates.
const FROST = {
  lastSpringFrost: '02-15',
  firstFallFrost: '12-01',
  frostFree: false,
  source: 'derived',
}

describe('classifyCrop', () => {
  it("puts a warm crop in 'now' during its summer transplant window", () => {
    // June 5 — tomato transplant window (after frost, matures before fall frost).
    const res = classifyCrop(crop('tomato'), FROST, new Date(2026, 5, 5, 12))
    expect(res.status).toBe('now')
    expect(res.method).toBe('transplant')
    expect(res.daysLeft).toBeGreaterThan(0)
  })

  it("schedules a cool crop's fall window as upcoming, not now, in summer", () => {
    // June 5 — lettuce spring window has passed; fall window opens in August.
    const res = classifyCrop(crop('lettuce'), FROST, new Date(2026, 5, 5, 12))
    expect(res.status).toBe('later') // >6 weeks out
    expect(res.season).toBe('fall')
    expect(res.daysUntilStart).toBeGreaterThan(42)
  })

  it("marks a fall window 'soon' once it is within 6 weeks", () => {
    // July 20 — broccoli fall transplant window opens mid-August (~29 days out).
    const res = classifyCrop(crop('broccoli'), FROST, new Date(2026, 6, 20, 12))
    expect(res.status).toBe('soon')
    expect(res.season).toBe('fall')
    expect(res.daysUntilStart).toBeLessThanOrEqual(42)
  })

  it('applies the maturity guard: too late to mature → next-year', () => {
    // Oct 1 — a long-season tender crop can no longer finish before first frost.
    const res = classifyCrop(crop('watermelon'), FROST, new Date(2026, 9, 1, 12))
    expect(res.status).toBe('next-year')
  })

  it('treats a frost-free climate as plantable year-round', () => {
    const res = classifyCrop(crop('tomato'), { frostFree: true }, new Date(2026, 0, 15, 12))
    expect(res.status).toBe('now')
    expect(res.frostFree).toBe(true)
  })
})

describe('getPlantingCalendar', () => {
  it('buckets crops into now / soon / later for a summer date', () => {
    const cal = getPlantingCalendar(CROPS, FROST, new Date(2026, 5, 5, 12))
    expect(cal.plantNow.length).toBeGreaterThan(0)
    // Warm-season fruiting crops should be plantable in early June.
    const nowIds = cal.plantNow.map((c) => c.crop.id)
    expect(nowIds).toContain('tomato')
    expect(nowIds).toContain('zucchini')
    // Every crop is accounted for in exactly one bucket.
    const total = cal.plantNow.length + cal.comingSoon.length + cal.later.length
    expect(total).toBe(CROPS.length)
  })
})
