import { describe, it, expect } from 'vitest'
import { CROPS } from '../crops'
import { classifyMoonQuarter } from '../../utils/moonPlanting'

const CATEGORIES = new Set([
  'Fruiting vegetable', 'Legume', 'Grain', 'Root', 'Herb', 'Leafy green', 'Brassica', 'Allium',
])
const METHODS = new Set(['direct-sow', 'start-indoors', 'transplant', 'plant-cloves'])
const REFS = new Set(['LSF', 'FFF'])
const SOURCES = new Set(['standard', 'estimate'])

describe('crop table integrity', () => {
  it('has unique ids', () => {
    const ids = CROPS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every crop has valid, complete fields', () => {
    for (const c of CROPS) {
      expect(c.id, `${c.id} id`).toMatch(/^[a-z][a-z-]*$/)
      expect(c.name?.length, `${c.id} name`).toBeGreaterThan(0)
      expect(c.emoji?.length, `${c.id} emoji`).toBeGreaterThan(0)
      expect(CATEGORIES.has(c.category), `${c.id} category "${c.category}"`).toBe(true)
      expect(typeof c.tender, `${c.id} tender`).toBe('boolean')
      expect(c.daysToMaturity, `${c.id} daysToMaturity`).toBeGreaterThan(0)
      expect(SOURCES.has(c.source), `${c.id} source "${c.source}"`).toBe(true)
      expect(c.windows.length, `${c.id} windows`).toBeGreaterThan(0)
    }
  })

  it('every planting window is well-formed (valid ref/method, start <= end)', () => {
    for (const c of CROPS) {
      for (const w of c.windows) {
        expect(METHODS.has(w.method), `${c.id} method "${w.method}"`).toBe(true)
        expect(REFS.has(w.ref), `${c.id} ref "${w.ref}"`).toBe(true)
        expect(Number.isInteger(w.start), `${c.id} start`).toBe(true)
        expect(Number.isInteger(w.end), `${c.id} end`).toBe(true)
        expect(w.start, `${c.id} start <= end`).toBeLessThanOrEqual(w.end)
      }
    }
  })

  // Cross-module contract: moonPlanting favors crops by CATEGORY string. If a crop
  // category isn't claimed by any moon quarter, it silently vanishes from the moon
  // view's "good to sow now" list. Guard the coupling.
  it('every crop category is claimed by some moon-planting quarter', () => {
    const favored = new Set(
      [0.1, 0.3, 0.6, 0.9].flatMap((phase) => classifyMoonQuarter(phase).favors)
    )
    for (const c of CROPS) {
      expect(favored.has(c.category), `${c.category} not referenced by any moon quarter`).toBe(true)
    }
  })
})
