import type { ToRole } from '../../content/types'
import type { DrillBest } from './drill'

/** シミュレーターの採点・スコアの純ロジック（lib/drill.ts と対になる） */

export type SimOutcome = 'correct' | 'wrong' | 'missed'

/** 集計に必要な最小の形（エンジンの SimEventResult がそのまま渡せる） */
export interface SimResultLog {
  outcome: SimOutcome
  delayMs: number | null
  windowMs: number
}

export interface SimSummary {
  correct: number
  wrong: number
  missed: number
  falseInputs: number
  total: number
  /** 反応した操作の平均遅延（見逃しは除外）。操作が1つもなければ null */
  avgDelayMs: number | null
  score: number
}

/**
 * セッション集計。正解 = 100 + 速度ボーナス(最大50)、誤り = 20（反応はした）、
 * 見逃し = 0、誤操作は1件につき −30（合計は0未満にしない）
 */
export function tallySim(logs: SimResultLog[], falseInputCount: number): SimSummary {
  let correct = 0
  let wrong = 0
  let missed = 0
  let score = 0
  const delays: number[] = []
  for (const log of logs) {
    if (log.outcome === 'missed') {
      missed += 1
      continue
    }
    const delay = log.delayMs ?? log.windowMs
    delays.push(delay)
    if (log.outcome === 'correct') {
      correct += 1
      const speedRatio = Math.max(0, Math.min(1, (log.windowMs - delay) / log.windowMs))
      score += 100 + Math.round(speedRatio * 50)
    } else {
      wrong += 1
      score += 20
    }
  }
  score = Math.max(0, score - falseInputCount * 30)
  const avgDelayMs =
    delays.length > 0 ? Math.round(delays.reduce((sum, d) => sum + d, 0) / delays.length) : null
  return { correct, wrong, missed, falseInputs: falseInputCount, total: logs.length, avgDelayMs, score }
}

export function isNewSimBest(prev: DrillBest | undefined, s: SimSummary): boolean {
  return !prev || s.score > prev.score
}

/** シミュレーター1セッションのXP（台本1本はドリルより長いので 5〜60 + ベスト更新10） */
export function simXp(s: SimSummary, newBest: boolean): number {
  const base = Math.max(5, Math.min(60, Math.round(s.score / 50)))
  return base + (newBest ? 10 : 0)
}

/** 自己ベストの保存キー（progressストアの drillBest に相乗りする） */
export function simBestKey(scriptId: string, role: ToRole): string {
  return `sim/${scriptId}/${role}`
}
