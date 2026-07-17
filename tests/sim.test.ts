import { describe, it, expect } from 'vitest'
import { isNewSimBest, simBestKey, simXp, tallySimSteps } from '../src/lib/sim'

const ok = { correct: true }
const ng = { correct: false }

describe('tallySimSteps', () => {
  it('正解・不正解・ベストストリークを集計する', () => {
    const s = tallySimSteps([ok, ok, ng, ok])
    expect(s).toMatchObject({ correct: 3, wrong: 1, total: 4, bestStreak: 2 })
  })

  it('スコア = 正解×100 + ベストストリーク×20', () => {
    expect(tallySimSteps([ok, ok, ng, ok]).score).toBe(300 + 40)
    expect(tallySimSteps([ng, ng]).score).toBe(0)
    expect(tallySimSteps([]).score).toBe(0)
  })
})

describe('simXp / simBestKey', () => {
  it('XPは 5〜60 に収まり、ベスト更新で +10', () => {
    expect(simXp(tallySimSteps([ng]), false)).toBe(5)
    const logs = Array.from({ length: 40 }, () => ok)
    expect(simXp(tallySimSteps(logs), false)).toBe(60)
    expect(simXp(tallySimSteps(logs), true)).toBe(70)
  })

  it('ベスト判定はスコアの更新のみ', () => {
    const s = tallySimSteps([ok])
    expect(isNewSimBest(undefined, s)).toBe(true)
    expect(isNewSimBest({ score: s.score, bestStreak: 0, avgReactionMs: null, at: 0 }, s)).toBe(
      false,
    )
    expect(isNewSimBest({ score: s.score - 1, bestStreak: 0, avgReactionMs: null, at: 0 }, s)).toBe(
      true,
    )
  })

  it('ベストキーは台本×役割×セグメントで分かれる', () => {
    expect(simBestKey('sim-game-u12', 'scorer', 'full')).toBe('sim/sim-game-u12/scorer/full')
    expect(simBestKey('sim-game-u12', 'scorer', 3)).toBe('sim/sim-game-u12/scorer/q3')
    expect(simBestKey('sim-game-u12', 'scorer', 'closing')).toBe('sim/sim-game-u12/scorer/closing')
    expect(simBestKey('sim-game-u12', 'scorer', 'full')).not.toBe(
      simBestKey('sim-game-u12', 'sc-operator', 'full'),
    )
  })
})
