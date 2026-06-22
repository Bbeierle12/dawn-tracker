import { describe, it, expect } from 'vitest'
import { computeGdd } from '../gdd'

/** Build a daily temp series of `n` days from `sow`, all at the same tmax/tmin. */
function constSeries(sow, n, tmax, tmin) {
  const time = []
  const max = []
  const min = []
  const start = new Date(`${sow}T12:00:00`)
  for (let i = 0; i < n; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    time.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    max.push(tmax)
    min.push(tmin)
  }
  return { time, temperature_2m_max: max, temperature_2m_min: min }
}

// 80/60 with base 50 -> modified GDD = (80 + 60)/2 - 50 = 20 per day.
const WARM = { daysToMaturity: 50, tender: true } // base 50, nominal 18 -> target 900

describe('computeGdd', () => {
  it('accumulates GDD and predicts a weather-adjusted harvest', () => {
    const temps = constSeries('2026-06-01', 61, 80, 60)
    const res = computeGdd(temps, '2026-06-01', WARM, new Date(2026, 5, 21, 12)) // June 21 = sow + 20

    expect(res.targetGDD).toBe(900)
    expect(res.accumulatedGDD).toBe(420) // 21 inclusive days * 20
    expect(res.dailyPace).toBe(20)
    expect(res.progress).toBeCloseTo(420 / 900, 4)
    // 900 GDD at 20/day = 45 inclusive days from sow -> July 15.
    expect(res.predictedHarvestDate.getMonth()).toBe(6) // July
    expect(res.predictedHarvestDate.getDate()).toBe(15)
    // Flat estimate is sow + 50 = July 21, so GDD has it 6 days ahead.
    expect(res.deltaDays).toBe(6)
  })

  it('falls back to the flat estimate for a future sow date', () => {
    const temps = constSeries('2026-06-01', 61, 80, 60)
    const res = computeGdd(temps, '2026-07-01', WARM, new Date(2026, 5, 21, 12))
    expect(res.accumulatedGDD).toBe(0)
    expect(res.progress).toBe(0)
    // sow July 1 + 50 days = Aug 20
    expect(res.predictedHarvestDate.getMonth()).toBe(7)
    expect(res.predictedHarvestDate.getDate()).toBe(20)
  })

  it('returns null without usable inputs', () => {
    expect(computeGdd(null, '2026-06-01', WARM)).toBeNull()
    expect(computeGdd({ time: [] }, '2026-06-01', WARM)).toBeNull()
    expect(computeGdd({ time: ['2026-06-01'] }, '2026-06-01', { daysToMaturity: null })).toBeNull()
  })
})
