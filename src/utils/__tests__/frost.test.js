import { describe, it, expect } from 'vitest'
import { deriveFrostDates } from '../frost'

/**
 * Build a synthetic Open-Meteo `daily` block from a sparse list of
 * [dateString, minTempF] entries. Only freeze days (<=32) drive the result,
 * so fixtures only need to list the days that matter.
 */
function daily(entries) {
  return {
    time: entries.map((e) => e[0]),
    temperature_2m_min: entries.map((e) => e[1]),
  }
}

describe('deriveFrostDates', () => {
  it('averages the latest spring and earliest fall freeze across years', () => {
    const result = deriveFrostDates(
      daily([
        // 2018 — latest spring freeze 02-20, earliest fall freeze 11-25
        ['2018-01-10', 28],
        ['2018-02-20', 30], // latest spring freeze
        ['2018-03-15', 45], // warm, ignored
        ['2018-11-25', 31], // earliest fall freeze
        ['2018-12-15', 25],
        // 2019 — spring 02-10, fall 12-01
        ['2019-02-10', 29],
        ['2019-12-01', 30],
        // 2020 — spring 03-02, fall 11-20
        ['2020-03-02', 32],
        ['2020-11-20', 28],
      ])
    )

    // Spring DOYs: 51, 41, 61 -> avg 51 -> Feb 20
    expect(result.lastSpringFrost).toBe('02-20')
    // Fall DOYs: 329, 335, 324 -> avg ~329 -> Nov 25
    expect(result.firstFallFrost).toBe('11-25')
    expect(result.years).toBe(3)
    expect(result.frostFree).toBe(false)
    expect(result.thresholdF).toBe(32)
  })

  it('flags a frost-free location when nothing dips to freezing', () => {
    const result = deriveFrostDates(
      daily([
        ['2020-01-01', 45],
        ['2020-07-01', 80],
        ['2020-12-31', 40],
      ])
    )
    expect(result.lastSpringFrost).toBeNull()
    expect(result.firstFallFrost).toBeNull()
    expect(result.frostFree).toBe(true)
  })

  it('handles empty input without throwing', () => {
    const result = deriveFrostDates({ time: [], temperature_2m_min: [] })
    expect(result.frostFree).toBe(true)
    expect(result.years).toBe(0)
  })
})
