import { describe, it, expect } from 'vitest'
import type { SimResultLog } from '../src/lib/sim'
import { isNewSimBest, simBestKey, simXp, tallySim } from '../src/lib/sim'

function log(outcome: SimResultLog['outcome'], delayMs: number | null = 3000): SimResultLog {
  return { outcome, delayMs, windowMs: 6000 }
}

describe('tallySim', () => {
  it('正解・誤り・見逃しを集計する', () => {
    const s = tallySim([log('correct'), log('wrong'), log('missed', null)], 0)
    expect(s).toMatchObject({ correct: 1, wrong: 1, missed: 1, total: 3 })
  })

  it('正解 = 100 + 速度ボーナス、誤り = 20', () => {
    // 遅延3000ms / 窓6000ms → 速度比0.5 → ボーナス25
    const s = tallySim([log('correct', 3000), log('wrong', 1000)], 0)
    expect(s.score).toBe(125 + 20)
  })

  it('速い操作ほどスコアが高い（単調性）', () => {
    const fast = tallySim([log('correct', 500)], 0)
    const slow = tallySim([log('correct', 5500)], 0)
    expect(fast.score).toBeGreaterThan(slow.score)
  })

  it('誤操作は1件につき−30、合計は0未満にならない', () => {
    expect(tallySim([log('correct', 3000)], 1).score).toBe(125 - 30)
    expect(tallySim([log('missed', null)], 5).score).toBe(0)
  })

  it('平均遅延は見逃しを除いて計算し、操作ゼロなら null', () => {
    const s = tallySim([log('correct', 2000), log('wrong', 4000), log('missed', null)], 0)
    expect(s.avgDelayMs).toBe(3000)
    expect(tallySim([log('missed', null)], 0).avgDelayMs).toBeNull()
  })
})

describe('simXp / simBestKey', () => {
  it('XPは 5〜60 に収まり、ベスト更新で +10', () => {
    const low = tallySim([log('missed', null)], 0)
    expect(simXp(low, false)).toBe(5)
    const logs = Array.from({ length: 30 }, () => log('correct', 0))
    const high = tallySim(logs, 0)
    expect(simXp(high, false)).toBe(60)
    expect(simXp(high, true)).toBe(70)
  })

  it('ベスト判定はスコアの更新のみ', () => {
    const s = tallySim([log('correct')], 0)
    expect(isNewSimBest(undefined, s)).toBe(true)
    expect(isNewSimBest({ score: s.score, bestStreak: 0, avgReactionMs: null, at: 0 }, s)).toBe(
      false,
    )
    expect(isNewSimBest({ score: s.score - 1, bestStreak: 0, avgReactionMs: null, at: 0 }, s)).toBe(
      true,
    )
  })

  it('ベストキーは台本×役割で分かれる', () => {
    expect(simBestKey('sim-q1-u12', 'scorer')).toBe('sim/sim-q1-u12/scorer')
    expect(simBestKey('sim-q1-u12', 'sc-operator')).not.toBe(simBestKey('sim-q1-u12', 'scorer'))
  })
})
