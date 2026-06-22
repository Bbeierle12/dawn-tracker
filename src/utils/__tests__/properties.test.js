import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { deriveFrostDates } from '../frost'
import { classifyCrop, getPlantingCalendar } from '../planting'
import { computeGdd } from '../gdd'
import { classifyMoonQuarter } from '../moonPlanting'
import { CROPS } from '../../data/crops'

const pad = (n) => String(n).padStart(2, '0')
const mmdd = (m, d) => `${pad(m)}-${pad(d)}`
const mmddToDate = (s, year) => {
  const [m, d] = s.split('-').map(Number)
  return new Date(year, m - 1, d, 12, 0, 0, 0)
}
const mmddToDOY = (s) => {
  const [m, d] = s.split('-').map(Number)
  return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000) + 1
}

// Frost dates with spring in Jan–May, fall in Sep–Dec (always spring < fall).
const frostArb = fc.record({
  sm: fc.integer({ min: 1, max: 5 }),
  sd: fc.integer({ min: 1, max: 28 }),
  fm: fc.integer({ min: 9, max: 12 }),
  fd: fc.integer({ min: 1, max: 28 }),
}).map(({ sm, sd, fm, fd }) => ({
  lastSpringFrost: mmdd(sm, sd),
  firstFallFrost: mmdd(fm, fd),
  spring: null,
  fall: null,
  frostFree: false,
}))

// Any day of the 2026 calendar.
const todayArb = fc.record({
  mo: fc.integer({ min: 0, max: 11 }),
  da: fc.integer({ min: 1, max: 28 }),
}).map(({ mo, da }) => new Date(2026, mo, da, 12, 0, 0, 0))

describe('planting calendar — invariants', () => {
  it('buckets every crop exactly once, for any frost dates and any day', () => {
    fc.assert(
      fc.property(frostArb, todayArb, (frost, today) => {
        const { plantNow, comingSoon, later } = getPlantingCalendar(CROPS, frost, today)
        const ids = [...plantNow, ...comingSoon, ...later].map((c) => c.crop.id)
        expect(ids.length).toBe(CROPS.length) // total preserved
        expect(new Set(ids).size).toBe(CROPS.length) // no crop double-counted
      })
    )
  })

  it('maturity guard: a tender crop is never "plant now" if it cannot ripen before first fall frost', () => {
    fc.assert(
      fc.property(frostArb, todayArb, (frost, today) => {
        const fff = mmddToDate(frost.firstFallFrost, today.getFullYear())
        for (const crop of CROPS.filter((c) => c.tender)) {
          const res = classifyCrop(crop, frost, today)
          if (res.status === 'now' && res.windowEnd) {
            // The window must end before first fall frost (the guard's purpose).
            expect(res.windowEnd.getTime()).toBeLessThanOrEqual(fff.getTime())
          }
        }
      })
    )
  })
})

describe('frost derivation — monotonicity', () => {
  // A clean single-trough annual cycle (coldest ~Jan 1), identical each year.
  function cosineSeries(meanF, ampF, years = [2017, 2018, 2019]) {
    const time = []
    const temps = []
    for (const y of years) {
      for (let doy = 1; doy <= 365; doy++) {
        const d = new Date(Date.UTC(y, 0, 1) + (doy - 1) * 86400000)
        time.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`)
        temps.push(meanF - ampF * Math.cos((2 * Math.PI * doy) / 365))
      }
    }
    return { time, temperature_2m_min: temps }
  }

  it('uniform cooling pushes last spring frost later and first fall frost earlier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 35, max: 55 }), // mean °F
        fc.integer({ min: 18, max: 35 }), // amplitude °F
        (meanF, ampF) => {
          // Need both a real freeze (trough below 32) and a real thaw (peak above 40).
          fc.pre(meanF - ampF < 28 && meanF + ampF > 42)
          const warm = deriveFrostDates(cosineSeries(meanF, ampF))
          const cold = deriveFrostDates(cosineSeries(meanF - 8, ampF))
          fc.pre(warm.lastSpringFrost && cold.lastSpringFrost && warm.firstFallFrost && cold.firstFallFrost)

          expect(mmddToDOY(cold.lastSpringFrost)).toBeGreaterThanOrEqual(mmddToDOY(warm.lastSpringFrost))
          expect(mmddToDOY(cold.firstFallFrost)).toBeLessThanOrEqual(mmddToDOY(warm.firstFallFrost))
        }
      )
    )
  })
})

describe('GDD prediction — monotonicity', () => {
  function constSeries(sow, n, tmax, tmin) {
    const time = []
    const max = []
    const min = []
    const start = new Date(`${sow}T12:00:00`)
    for (let i = 0; i < n; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      time.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
      max.push(tmax)
      min.push(tmin)
    }
    return { time, temperature_2m_max: max, temperature_2m_min: min }
  }

  it('hotter weather never delays the predicted harvest', () => {
    const crop = { daysToMaturity: 60, tender: true }
    fc.assert(
      fc.property(
        fc.integer({ min: 55, max: 95 }), // tmax
        fc.integer({ min: 35, max: 50 }), // tmin
        (tmax, tmin) => {
          fc.pre(tmax > tmin)
          const today = new Date(2026, 4, 31, 12) // sow + 30
          const base = computeGdd(constSeries('2026-05-01', 150, tmax, tmin), '2026-05-01', crop, today)
          const hotter = computeGdd(constSeries('2026-05-01', 150, tmax + 10, tmin + 10), '2026-05-01', crop, today)
          expect(hotter.predictedHarvestDate.getTime()).toBeLessThanOrEqual(base.predictedHarvestDate.getTime())
        }
      )
    )
  })
})

describe('moon classification — totality', () => {
  it('returns a valid quarter for any phase in [0,1)', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 0.9999, noNaN: true }), (phase) => {
        const q = classifyMoonQuarter(phase)
        expect([1, 2, 3, 4]).toContain(q.quarter)
        expect(Array.isArray(q.favors)).toBe(true)
      })
    )
  })
})
