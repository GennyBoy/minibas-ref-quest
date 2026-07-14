import { z } from 'zod'

/** TOの5役割 */
export const TO_ROLES = ['scorer', 'a-scorer', 'timer', 'sc-operator', 'to-supporter'] as const
export type ToRole = (typeof TO_ROLES)[number]

export const ROLE_LABELS: Record<ToRole, string> = {
  scorer: 'スコアラー',
  'a-scorer': 'Aスコアラー',
  timer: 'タイマー',
  'sc-operator': 'SCオペレーター',
  'to-supporter': 'TOサポーター',
}

export const ROLE_DESCRIPTIONS: Record<ToRole, string> = {
  scorer: 'スコアシートの記録・審判への合図・APアロー',
  'a-scorer': 'スコアボード操作・ファウル表示・スコアラーの相棒',
  timer: 'ゲームクロック・タイムアウト・インターバルの計測',
  'sc-operator': 'ショットクロックの操作と24秒ルールの適用',
  'to-supporter': 'TOを務める子どもたちを後ろから見守り支える大人',
}

export const DOMAINS = [
  'u12-diff',
  'to-basics',
  'to-scoresheet',
  'to-clock',
  'to-cases',
  'violations',
  'fouls',
] as const
export type Domain = (typeof DOMAINS)[number]

export const DOMAIN_LABELS: Record<Domain, string> = {
  'u12-diff': 'U12固有ルール',
  'to-basics': 'TOの基礎',
  'to-scoresheet': 'スコアシート',
  'to-clock': 'クロック操作',
  'to-cases': '難しいケース',
  violations: 'バイオレーション',
  fouls: 'ファウル',
}

/** u12: U12のみ / general: 一般のみ / both: 共通 */
export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z]{2}-\d{3}$/),
    domain: z.enum(DOMAINS),
    roles: z.array(z.enum(TO_ROLES)).min(1).optional(),
    ruleset: z.enum(['u12', 'general', 'both']),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    prompt: z.string().min(10),
    explanation: z.string().min(10),
    refs: z.array(z.string()).min(1),
    ruleYear: z.number().int(),
  })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('single'),
        choices: z.array(z.string()).min(2).max(4),
        answer: z.number().int().min(0),
      }),
      z.object({
        type: z.literal('truefalse'),
        answer: z.boolean(),
      }),
    ]),
  )

export type Question = z.infer<typeof questionSchema>

export function validateQuestions(questions: Question[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const q of questions) {
    const result = questionSchema.safeParse(q)
    if (!result.success) {
      errors.push(`${q.id ?? '(no id)'}: ${result.error.issues.map((i) => i.message).join(', ')}`)
      continue
    }
    if (seen.has(q.id)) errors.push(`${q.id}: ID重複`)
    seen.add(q.id)
    if (q.type === 'single' && q.answer >= q.choices.length) {
      errors.push(`${q.id}: answerが選択肢の範囲外`)
    }
  }
  return errors
}
