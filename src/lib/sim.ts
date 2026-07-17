import type { ToRole } from '../../content/types'
import type { SimSegment } from '../features/tosim/steps'
import type { DrillBest } from './drill'

/** ターン制シミュレーターの採点・スコアの純ロジック（lib/drill.ts と対になる） */

export interface SimStepLog {
  correct: boolean
}

export interface SimSummary {
  correct: number
  wrong: number
  total: number
  bestStreak: number
  score: number
}

/** セッション集計。正解 = 100点、最後にベストストリーク×20（時間要素なし） */
export function tallySimSteps(logs: SimStepLog[]): SimSummary {
  let correct = 0
  let streak = 0
  let bestStreak = 0
  for (const log of logs) {
    if (log.correct) {
      correct += 1
      streak += 1
      if (streak > bestStreak) bestStreak = streak
    } else {
      streak = 0
    }
  }
  const score = correct * 100 + bestStreak * 20
  return { correct, wrong: logs.length - correct, total: logs.length, bestStreak, score }
}

export function isNewSimBest(prev: DrillBest | undefined, s: SimSummary): boolean {
  return !prev || s.score > prev.score
}

/** シミュレーター1セッションのXP（通し≒40問はドリルより長いので 5〜60 + ベスト更新10） */
export function simXp(s: SimSummary, newBest: boolean): number {
  const base = Math.max(5, Math.min(60, Math.round(s.score / 50)))
  return base + (newBest ? 10 : 0)
}

/** 自己ベストの保存キー（progressストアの drillBest に相乗り。セグメント別に別記録） */
export function simBestKey(scriptId: string, role: ToRole, segment: SimSegment): string {
  return `sim/${scriptId}/${role}/${typeof segment === 'number' ? `q${segment}` : segment}`
}
