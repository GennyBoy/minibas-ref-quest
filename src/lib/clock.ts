/**
 * ゲームクロック／ショットクロックの純ロジック。
 * 時刻は引数で受け取る（performance.now() 前提だが単体テストでは任意の値）。
 * 残り時間は「最後に同期した残り時間 − 経過時間」で導出するため、
 * 呼び出し頻度に依存したドリフトが起きない。
 */
export interface ClockState {
  running: boolean
  /** syncedAt 時点での残りミリ秒 */
  remainingMs: number
  /** 最後に start した時刻（停止中は null） */
  syncedAt: number | null
}

export function createClock(remainingMs: number): ClockState {
  return { running: false, remainingMs: Math.max(0, remainingMs), syncedAt: null }
}

export function start(c: ClockState, now: number): ClockState {
  if (c.running || c.remainingMs <= 0) return c
  return { running: true, remainingMs: c.remainingMs, syncedAt: now }
}

export function stop(c: ClockState, now: number): ClockState {
  if (!c.running) return c
  return { running: false, remainingMs: remaining(c, now), syncedAt: null }
}

export function reset(_c: ClockState, remainingMs: number): ClockState {
  return createClock(remainingMs)
}

/** 現在の残りミリ秒（0未満にはならない） */
export function remaining(c: ClockState, now: number): number {
  if (!c.running || c.syncedAt === null) return Math.max(0, c.remainingMs)
  return Math.max(0, c.remainingMs - (now - c.syncedAt))
}

/** ゲームクロック表示: 60秒以上は「分:秒」、60秒未満は「秒.1/10秒」 */
export function formatGameClock(ms: number): string {
  const clamped = Math.max(0, ms)
  if (clamped >= 60000) {
    const totalSec = Math.floor(clamped / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
  const s = Math.floor(clamped / 1000)
  const tenth = Math.floor((clamped % 1000) / 100)
  return `${s}.${tenth}`
}

/** ショットクロック表示: 秒の切り上げ（実機と同じく 24→…→1、0で「0」） */
export function formatShotClock(ms: number): string {
  return String(Math.ceil(Math.max(0, ms) / 1000))
}
