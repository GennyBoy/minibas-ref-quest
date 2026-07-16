import type { DrillId } from '../../content/drills/types'

/** ドリルの出題モード */
export type DrillMode = 'u12' | 'general' | 'compare'

export const DRILL_MODE_LABELS: Record<DrillMode, string> = {
  u12: 'U12',
  general: '一般',
  compare: 'くらべる',
}

/** 1問ごとの回答記録 */
export interface DrillAnswerLog {
  correct: boolean
  reactionMs: number
  /** 制限時間切れ（誤答扱い・反応時間の平均からは除外） */
  timedOut: boolean
}

export interface DrillScore {
  correct: number
  total: number
  bestStreak: number
  /** タイムアウトを除いた平均反応時間。回答が1つもなければ null */
  avgReactionMs: number | null
  score: number
}

/** 自己ベスト（progressストアに drillBestKey で保存） */
export interface DrillBest {
  score: number
  bestStreak: number
  avgReactionMs: number | null
  at: number
}

/**
 * セッション集計。スコア = 正解ごとに 100 + 速度ボーナス(最大50) + ベストストリーク×20
 */
export function tallyDrill(logs: DrillAnswerLog[], timeLimitMs: number): DrillScore {
  let correct = 0
  let streak = 0
  let bestStreak = 0
  let score = 0
  const reactions: number[] = []
  for (const log of logs) {
    if (!log.timedOut) reactions.push(log.reactionMs)
    if (log.correct) {
      correct += 1
      streak += 1
      if (streak > bestStreak) bestStreak = streak
      const speedRatio = Math.max(0, Math.min(1, (timeLimitMs - log.reactionMs) / timeLimitMs))
      score += 100 + Math.round(speedRatio * 50)
    } else {
      streak = 0
    }
  }
  score += bestStreak * 20
  const avgReactionMs =
    reactions.length > 0
      ? Math.round(reactions.reduce((sum, r) => sum + r, 0) / reactions.length)
      : null
  return { correct, total: logs.length, bestStreak, avgReactionMs, score }
}

export function isNewBest(prev: DrillBest | undefined, s: DrillScore): boolean {
  return !prev || s.score > prev.score
}

/** ドリル1セッションのXP（クイズ1問=10-30XPとのバランスで 5〜40 + ベスト更新10） */
export function drillXp(s: DrillScore, newBest: boolean): number {
  const base = Math.max(5, Math.min(40, Math.round(s.score / 50)))
  return base + (newBest ? 10 : 0)
}

/** 自己ベストの保存キー（モード別に別記録） */
export function drillBestKey(id: DrillId, mode: DrillMode): string {
  return `${id}/${mode}`
}
