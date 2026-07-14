import { describe, it, expect } from 'vitest'
import { questionXp, levelForXp } from '../src/lib/xp'

describe('questionXp', () => {
  const base = { correct: true, wasDue: false, firstSeen: false, streak: 1, comboBonusSoFar: 0 }

  it('正解は10×難易度', () => {
    expect(questionXp({ ...base, difficulty: 1 })).toBe(10)
    expect(questionXp({ ...base, difficulty: 3 })).toBe(30)
  })

  it('不正解は参加XP 2', () => {
    expect(questionXp({ ...base, difficulty: 3, correct: false })).toBe(2)
  })

  it('復習期限到来の正解は1.5倍', () => {
    expect(questionXp({ ...base, difficulty: 2, wasDue: true })).toBe(30)
  })

  it('初見正解は+5', () => {
    expect(questionXp({ ...base, difficulty: 1, firstSeen: true })).toBe(15)
  })

  it('3連続正解ごとに+5、上限あり', () => {
    expect(questionXp({ ...base, difficulty: 1, streak: 3 })).toBe(15)
    expect(questionXp({ ...base, difficulty: 1, streak: 3, comboBonusSoFar: 20 })).toBe(10)
    expect(questionXp({ ...base, difficulty: 1, streak: 4 })).toBe(10)
  })
})

describe('levelForXp', () => {
  it('0XPはレベル1', () => {
    expect(levelForXp(0).level).toBe(1)
  })
  it('100XPでレベル2、閾値は逓増', () => {
    const l = levelForXp(100)
    expect(l.level).toBe(2)
    expect(l.current).toBe(0)
    expect(l.next).toBe(125)
  })
})
