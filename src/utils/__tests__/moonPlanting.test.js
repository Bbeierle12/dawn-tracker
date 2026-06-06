import { describe, it, expect } from 'vitest'
import {
  classifyMoonQuarter,
  getMoonPlantingGuidance,
  getUpcomingWindows,
  cropsForCategories,
} from '../moonPlanting'
import { CROPS } from '../../data/crops'

describe('classifyMoonQuarter', () => {
  it('maps each phase to the right quarter and crop affinity', () => {
    expect(classifyMoonQuarter(0.1)).toMatchObject({ quarter: 1 })
    expect(classifyMoonQuarter(0.1).favors).toContain('Leafy green')

    expect(classifyMoonQuarter(0.3)).toMatchObject({ quarter: 2 })
    expect(classifyMoonQuarter(0.3).favors).toContain('Fruiting vegetable')

    expect(classifyMoonQuarter(0.6)).toMatchObject({ quarter: 3 })
    expect(classifyMoonQuarter(0.6).favors).toContain('Root')

    expect(classifyMoonQuarter(0.9)).toMatchObject({ quarter: 4 })
    expect(classifyMoonQuarter(0.9).favors).toEqual([])
  })

  it('places quarter boundaries on the upper interval', () => {
    expect(classifyMoonQuarter(0).quarter).toBe(1)
    expect(classifyMoonQuarter(0.25).quarter).toBe(2)
    expect(classifyMoonQuarter(0.5).quarter).toBe(3)
    expect(classifyMoonQuarter(0.75).quarter).toBe(4)
  })
})

describe('getMoonPlantingGuidance', () => {
  it('returns a structured guidance object for a date', () => {
    const g = getMoonPlantingGuidance(new Date(2026, 5, 5, 12))
    expect(g.quarter).toBeGreaterThanOrEqual(1)
    expect(g.quarter).toBeLessThanOrEqual(4)
    expect(typeof g.phaseName).toBe('string')
    expect(typeof g.advice).toBe('string')
  })
})

describe('getUpcomingWindows', () => {
  it('collapses the next days into contiguous windows, the first being current', () => {
    const windows = getUpcomingWindows(new Date(2026, 5, 5, 12), 30)
    expect(windows.length).toBeGreaterThan(0)
    expect(windows[0].isCurrent).toBe(true)
    for (const w of windows) {
      expect(w.start instanceof Date).toBe(true)
      expect(w.end.getTime()).toBeGreaterThanOrEqual(w.start.getTime())
    }
  })
})

describe('cropsForCategories', () => {
  it('filters the crop table by favored categories', () => {
    const roots = cropsForCategories(CROPS, ['Root'])
    expect(roots.length).toBeGreaterThan(0)
    expect(roots.every((c) => c.category === 'Root')).toBe(true)
    expect(cropsForCategories(CROPS, [])).toEqual([])
  })
})
