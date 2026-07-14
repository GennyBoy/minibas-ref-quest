import type { SrsState } from './srs'

const DAY_MS = 24 * 60 * 60 * 1000
const HALF_LIFE_DAYS = 14

/**
 * 習熟度 = カバレッジ × 直近重み付き正答率（半減期14日）。
 * 未出題が残る限り100%にならず、昔の正解は時間とともに減衰する。
 */
export function mastery(
  questionIds: string[],
  srs: Record<string, SrsState>,
  now: number,
): number {
  if (questionIds.length === 0) return 0
  let seen = 0
  let weightSum = 0
  let correctSum = 0
  for (const id of questionIds) {
    const s = srs[id]
    if (!s || s.history.length === 0) continue
    seen += 1
    for (const h of s.history) {
      const ageDays = Math.max(0, now - h.at) / DAY_MS
      const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS)
      weightSum += w
      if (h.correct) correctSum += w
    }
  }
  if (weightSum === 0) return 0
  const coverage = seen / questionIds.length
  const accuracy = correctSum / weightSum
  return coverage * accuracy
}
