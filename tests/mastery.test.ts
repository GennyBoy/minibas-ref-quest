import { describe, it, expect } from 'vitest'
import { mastery } from '../src/lib/mastery'
import { review } from '../src/lib/srs'
import type { SrsState } from '../src/lib/srs'

const DAY = 24 * 60 * 60 * 1000
const now = Date.parse('2026-07-13T09:00:00Z')

describe('mastery', () => {
  it('未出題があると100%にならない', () => {
    const srs: Record<string, SrsState> = { a: review(undefined, true, now) }
    const m = mastery(['a', 'b'], srs, now)
    expect(m).toBeGreaterThan(0.4)
    expect(m).toBeLessThanOrEqual(0.5)
  })

  it('全問直近正解なら1に近い', () => {
    const srs: Record<string, SrsState> = {
      a: review(undefined, true, now),
      b: review(undefined, true, now),
    }
    expect(mastery(['a', 'b'], srs, now)).toBeCloseTo(1)
  })

  it('昔の正解は減衰し、直近の不正解が重く効く', () => {
    const oldCorrect = review(undefined, true, now - 60 * DAY)
    const recentWrong = review(oldCorrect, false, now)
    const srs: Record<string, SrsState> = { a: recentWrong }
    expect(mastery(['a'], srs, now)).toBeLessThan(0.1)
  })

  it('問題ゼロ・学習ゼロは0', () => {
    expect(mastery([], {}, now)).toBe(0)
    expect(mastery(['a'], {}, now)).toBe(0)
  })
})
