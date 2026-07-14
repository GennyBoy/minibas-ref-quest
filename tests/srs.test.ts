import { describe, it, expect } from 'vitest'
import { initialSrs, review, isDue } from '../src/lib/srs'

const DAY = 24 * 60 * 60 * 1000
const now = Date.parse('2026-07-13T09:00:00Z')

describe('srs', () => {
  it('初回正解で1日後にdue', () => {
    const s = review(undefined, true, now)
    expect(s.intervalDays).toBe(1)
    expect(s.dueAt).toBe(now + DAY)
    expect(s.reps).toBe(1)
    expect(s.ease).toBeCloseTo(2.55)
  })

  it('2回目の正解で3日、3回目はinterval×ease', () => {
    let s = review(undefined, true, now)
    s = review(s, true, now + DAY)
    expect(s.intervalDays).toBe(3)
    s = review(s, true, now + 4 * DAY)
    expect(s.intervalDays).toBe(Math.round(3 * 2.6))
  })

  it('不正解でease低下・10分後に再出題・repsリセット', () => {
    let s = review(undefined, true, now)
    s = review(s, false, now + DAY)
    expect(s.ease).toBeCloseTo(2.35)
    expect(s.dueAt).toBe(now + DAY + 10 * 60 * 1000)
    expect(s.reps).toBe(0)
    expect(s.lapses).toBe(1)
  })

  it('easeは1.3〜2.8にクランプされる', () => {
    let s = initialSrs(now)
    for (let i = 0; i < 20; i++) s = review(s, false, now + i)
    expect(s.ease).toBeCloseTo(1.3)
    for (let i = 0; i < 40; i++) s = review(s, true, now + 100 + i)
    expect(s.ease).toBeCloseTo(2.8)
  })

  it('isDue: 未学習はfalse、期限到来でtrue', () => {
    expect(isDue(undefined, now)).toBe(false)
    const s = review(undefined, true, now)
    expect(isDue(s, now + DAY - 1)).toBe(false)
    expect(isDue(s, now + DAY)).toBe(true)
  })

  it('historyは20件で打ち切り', () => {
    let s = initialSrs(now)
    for (let i = 0; i < 30; i++) s = review(s, true, now + i)
    expect(s.history.length).toBe(20)
  })
})
