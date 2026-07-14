/**
 * 間隔反復（SM-2簡易版・自信申告なし）。
 * Vault の rule-test-mistakes.md「翌日→1週間後→試合前日」の思想を一般化したもの。
 */

export interface SrsState {
  ease: number
  intervalDays: number
  dueAt: number
  reps: number
  lapses: number
  history: { at: number; correct: boolean }[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const RELEARN_MS = 10 * 60 * 1000 // 不正解はセッション末（10分後）に再出題
const HISTORY_LIMIT = 20

export function initialSrs(now: number): SrsState {
  return { ease: 2.5, intervalDays: 0, dueAt: now, reps: 0, lapses: 0, history: [] }
}

export function review(prev: SrsState | undefined, correct: boolean, now: number): SrsState {
  const s = prev ?? initialSrs(now)
  const history = [...s.history, { at: now, correct }].slice(-HISTORY_LIMIT)
  if (correct) {
    const intervalDays = s.reps === 0 ? 1 : s.reps === 1 ? 3 : Math.round(s.intervalDays * s.ease)
    return {
      ease: Math.min(2.8, s.ease + 0.05),
      intervalDays,
      dueAt: now + intervalDays * DAY_MS,
      reps: s.reps + 1,
      lapses: s.lapses,
      history,
    }
  }
  return {
    ease: Math.max(1.3, s.ease - 0.2),
    intervalDays: 0,
    dueAt: now + RELEARN_MS,
    reps: 0,
    lapses: s.lapses + 1,
    history,
  }
}

export function isDue(s: SrsState | undefined, now: number): boolean {
  return s !== undefined && s.dueAt <= now
}
