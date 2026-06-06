import { describe, it, expect } from 'vitest'
import { deriveFrostDates, pickFrostDates } from '../frost'

function daily(entries) {
  return { time: entries.map((e) => e[0]), temperature_2m_min: entries.map((e) => e[1]) }
}
const monthOf = (mmdd) => Number(mmdd.split('-')[0])
const doy = (mmdd) => {
  const [m, d] = mmdd.split('-').map(Number)
  return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000) + 1
}

describe('frost percentiles', () => {
  it('orders p10 <= p50 <= p90 for spring and fall', () => {
    // 10 years, last spring freeze spread Feb 1 → Mar 18, first fall Nov 10 → Dec 3.
    const entries = []
    for (let i = 0; i < 10; i++) {
      const y = 2010 + i
      const springDoy = 32 + 5 * i // Feb 1 .. Mar 18
      const fallDoy = 314 + (i % 6) * 4 // ~Nov 10 .. Dec 3
      const sd = new Date(Date.UTC(2001, 0, 1) + (springDoy - 1) * 86400000)
      const fd = new Date(Date.UTC(2001, 0, 1) + (fallDoy - 1) * 86400000)
      const fmt = (d) => `${y}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      entries.push([fmt(sd), 28], [fmt(fd), 28])
    }
    const r = deriveFrostDates(daily(entries))
    expect(doy(r.spring.p10)).toBeLessThanOrEqual(doy(r.spring.p50))
    expect(doy(r.spring.p50)).toBeLessThanOrEqual(doy(r.spring.p90))
    expect(doy(r.fall.p10)).toBeLessThanOrEqual(doy(r.fall.p50))
    expect(doy(r.fall.p50)).toBeLessThanOrEqual(doy(r.fall.p90))
    // A real spread should separate the tails.
    expect(doy(r.spring.p90)).toBeGreaterThan(doy(r.spring.p10))
  })
})

describe('southern hemisphere', () => {
  it('derives spring frost in Aug–Nov and fall frost in Mar–Jun', () => {
    // Southern-hemisphere pattern: growing season straddles the new year. Last
    // spring freeze ~late Sep, first fall (autumn) freeze ~early May.
    const entries = []
    for (let i = 0; i < 5; i++) {
      const y = 2015 + i
      entries.push(
        [`${y}-08-20`, 28], // early spring freeze (should be dominated)
        [`${y}-09-25`, 30], // latest spring freeze
        [`${y}-05-01`, 30], // earliest fall freeze
        [`${y}-06-10`, 28]  // later fall freeze (should be dominated)
      )
    }
    const r = deriveFrostDates(daily(entries), -33.87) // Sydney latitude
    expect(r.hemisphere).toBe('S')
    expect(monthOf(r.lastSpringFrost)).toBeGreaterThanOrEqual(8) // Aug–Nov
    expect(monthOf(r.lastSpringFrost)).toBeLessThanOrEqual(11)
    expect(monthOf(r.firstFallFrost)).toBeGreaterThanOrEqual(3) // Mar–Jun
    expect(monthOf(r.firstFallFrost)).toBeLessThanOrEqual(6)
  })
})

describe('pickFrostDates', () => {
  const fd = {
    lastSpringFrost: '02-15', firstFallFrost: '11-25',
    spring: { mean: '02-15', p10: '02-05', p50: '02-15', p90: '02-25' },
    fall: { mean: '11-25', p10: '11-15', p50: '11-25', p90: '12-05' },
    frostFree: false,
  }

  it('conservative plants late and harvests early (p90 spring, p10 fall)', () => {
    expect(pickFrostDates(fd, 'conservative')).toMatchObject({ lastSpringFrost: '02-25', firstFallFrost: '11-15' })
  })
  it('aggressive pushes the season (p10 spring, p90 fall)', () => {
    expect(pickFrostDates(fd, 'aggressive')).toMatchObject({ lastSpringFrost: '02-05', firstFallFrost: '12-05' })
  })
  it('moderate uses the median (p50)', () => {
    expect(pickFrostDates(fd, 'moderate')).toMatchObject({ lastSpringFrost: '02-15', firstFallFrost: '11-25' })
  })
})
