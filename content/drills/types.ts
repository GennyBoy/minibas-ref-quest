import { z } from 'zod'

/** ドリルの種類（Phase 2） */
export const DRILL_IDS = ['shotclock', 'gameclock', 'sheet'] as const
export type DrillId = (typeof DRILL_IDS)[number]

/** SCオペレータードリルの4アクション */
export const SHOT_CLOCK_ACTIONS = ['reset24', 'reset14', 'keep', 'stopOnly'] as const
export const shotClockActionSchema = z.enum(SHOT_CLOCK_ACTIONS)
export type ShotClockAction = z.infer<typeof shotClockActionSchema>

export const SHOT_CLOCK_ACTION_LABELS: Record<ShotClockAction, string> = {
  reset24: '24秒にリセット',
  reset14: '14秒にリセット',
  keep: '継続（そのまま）',
  stopOnly: '止めるだけ',
}

/**
 * ショットクロック判断ケース。
 * answer はルールセット別（U12と一般で答えが違うケースは u12 !== general になる）。
 */
export const shotClockCaseSchema = z.object({
  id: z.string().regex(/^sc-\d{3}$/),
  /** 場面の説明（U12・一般どちらでも成立する表現で書く） */
  situation: z.string().min(8),
  /** 場面発生時のショットクロック残り秒（演出と「13秒以下」文脈の両方に使う） */
  shotClockBefore: z.number().int().min(1).max(24),
  answer: z.object({
    u12: shotClockActionSchema,
    general: shotClockActionSchema,
  }),
  explanation: z.string().min(10),
  refs: z.array(z.string()).min(1),
  ruleYear: z.number().int(),
})
export type ShotClockCase = z.infer<typeof shotClockCaseSchema>

/** U12と一般で答えが分かれるケースか（くらべるモードの出題対象） */
export function isDivergent(c: Pick<ShotClockCase, 'answer'>): boolean {
  return c.answer.u12 !== c.answer.general
}

/** ドリルコンテンツ全体の検証（validate-content から呼ぶ） */
export function validateDrillContent(content: { shotClockCases: ShotClockCase[] }): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const c of content.shotClockCases) {
    const result = shotClockCaseSchema.safeParse(c)
    if (!result.success) {
      errors.push(
        `${c.id ?? '(no id)'}: ${result.error.issues.map((i) => i.message).join(', ')}`,
      )
      continue
    }
    if (seen.has(c.id)) errors.push(`${c.id}: ID重複`)
    seen.add(c.id)
  }
  return errors
}
