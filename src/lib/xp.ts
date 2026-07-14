export interface XpInput {
  difficulty: 1 | 2 | 3
  correct: boolean
  /** SRSの期限が到来していた問題か（復習を最も報酬化する） */
  wasDue: boolean
  /** 初めて解く問題か */
  firstSeen: boolean
  /** セッション内の現在の連続正解数（この問題を含む） */
  streak: number
  /** セッション内でこれまでに付与したコンボボーナスの合計 */
  comboBonusSoFar: number
}

export const COMBO_BONUS = 5
export const COMBO_BONUS_CAP = 20

export function questionXp(input: XpInput): number {
  if (!input.correct) return 2 // 参加XP
  let xp = 10 * input.difficulty
  if (input.wasDue) xp = Math.round(xp * 1.5)
  if (input.firstSeen) xp += 5
  if (input.streak > 0 && input.streak % 3 === 0 && input.comboBonusSoFar < COMBO_BONUS_CAP) {
    xp += COMBO_BONUS
  }
  return xp
}

/** XPからレベルを算出（表示用。100XPごとに1レベル、緩やかに逓増） */
export function levelForXp(xp: number): { level: number; current: number; next: number } {
  let level = 1
  let threshold = 100
  let remaining = xp
  while (remaining >= threshold) {
    remaining -= threshold
    level += 1
    threshold = 100 + (level - 1) * 25
  }
  return { level, current: remaining, next: threshold }
}
