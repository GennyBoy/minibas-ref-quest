import type { Question, ToRole } from '../../content'
import type { SrsState } from './srs'
import { isDue } from './srs'

/**
 * セッションの問題選定: SRS期限到来 → 未出題 → 既出題（習熟の浅い順）の優先度で埋める。
 */
export function buildSession(
  questions: Question[],
  srs: Record<string, SrsState>,
  role: ToRole | null,
  now: number,
  count = 10,
): Question[] {
  const pool = role ? questions.filter((q) => q.roles?.includes(role)) : questions

  const due = shuffle(pool.filter((q) => isDue(srs[q.id], now)))
  const unseen = shuffle(pool.filter((q) => !srs[q.id]))
  const rest = shuffle(pool.filter((q) => srs[q.id] && !isDue(srs[q.id], now))).sort(
    (a, b) => recentAccuracy(srs[a.id]) - recentAccuracy(srs[b.id]),
  )

  return [...due, ...unseen, ...rest].slice(0, count)
}

export function dueCount(
  questions: Question[],
  srs: Record<string, SrsState>,
  role: ToRole | null,
  now: number,
): number {
  const pool = role ? questions.filter((q) => q.roles?.includes(role)) : questions
  return pool.filter((q) => isDue(srs[q.id], now)).length
}

function recentAccuracy(s: SrsState): number {
  if (s.history.length === 0) return 0
  const recent = s.history.slice(-5)
  return recent.filter((h) => h.correct).length / recent.length
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
