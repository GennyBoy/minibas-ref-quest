import { describe, it, expect } from 'vitest'
import {
  tallyDrill,
  isNewBest,
  drillXp,
  drillBestKey,
  type DrillAnswerLog,
} from '../src/lib/drill'

const LIMIT = 5000

function log(correct: boolean, reactionMs = 2500, timedOut = false): DrillAnswerLog {
  return { correct, reactionMs, timedOut }
}

describe('tallyDrill', () => {
  it('正解数・ベストストリークを集計する', () => {
    const s = tallyDrill([log(true), log(true), log(false), log(true)], LIMIT)
    expect(s.correct).toBe(3)
    expect(s.total).toBe(4)
    expect(s.bestStreak).toBe(2)
  })

  it('スコア = 正解100+速度ボーナス + ベストストリーク×20', () => {
    // 反応2500ms → 速度比0.5 → ボーナス25
    const s = tallyDrill([log(true, 2500)], LIMIT)
    expect(s.score).toBe(100 + 25 + 20)
  })

  it('速い回答ほどスコアが高い（単調性）', () => {
    const fast = tallyDrill([log(true, 500)], LIMIT)
    const slow = tallyDrill([log(true, 4500)], LIMIT)
    expect(fast.score).toBeGreaterThan(slow.score)
  })

  it('タイムアウトは平均反応時間から除外される', () => {
    const s = tallyDrill([log(true, 2000), log(false, LIMIT, true)], LIMIT)
    expect(s.avgReactionMs).toBe(2000)
  })

  it('全問タイムアウトなら平均反応は null、スコア0', () => {
    const s = tallyDrill([log(false, LIMIT, true), log(false, LIMIT, true)], LIMIT)
    expect(s.avgReactionMs).toBeNull()
    expect(s.score).toBe(0)
  })

  it('誤答でストリークが切れる', () => {
    const s = tallyDrill([log(true), log(false), log(true), log(true), log(true)], LIMIT)
    expect(s.bestStreak).toBe(3)
  })
})

describe('isNewBest / drillXp / drillBestKey', () => {
  it('初回は常にベスト、以後はスコア超過のみ', () => {
    const s = tallyDrill([log(true)], LIMIT)
    expect(isNewBest(undefined, s)).toBe(true)
    expect(isNewBest({ score: s.score, bestStreak: 1, avgReactionMs: 100, at: 0 }, s)).toBe(false)
    expect(isNewBest({ score: s.score - 1, bestStreak: 1, avgReactionMs: 100, at: 0 }, s)).toBe(
      true,
    )
  })

  it('XPは5〜40にクランプ、ベスト更新で+10', () => {
    const zero = tallyDrill([log(false)], LIMIT)
    expect(drillXp(zero, false)).toBe(5)
    const perfect = tallyDrill(
      Array.from({ length: 20 }, () => log(true, 0)),
      LIMIT,
    )
    expect(drillXp(perfect, false)).toBe(40)
    expect(drillXp(perfect, true)).toBe(50)
  })

  it('ベストスコアのキーはモード別', () => {
    expect(drillBestKey('shotclock', 'u12')).toBe('shotclock/u12')
    expect(drillBestKey('shotclock', 'compare')).toBe('shotclock/compare')
  })
})
