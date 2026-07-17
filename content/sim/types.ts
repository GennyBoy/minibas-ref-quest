import { z } from 'zod'
import { placedMarkSchema, quarterSchema, teamSchema } from '../drills/types'

/**
 * TOシミュレーターのGameScript（試合台本）。ターン制（イベントステップ式）:
 * イベントを1つずつ提示し、役割の期待アクションと突き合わせて即採点する。
 * ゲームクロックは gameClockMs の著述が正。ショットクロックは「ゲームクロックが
 * 動いている間だけ減る」ため、イベント間のSC減少量 = gameClockMs の差分で
 * 畳み込み再現できる（foldShotClock）。validate-content が SC切れ・記入ルールを
 * 機械検証する。
 */

/** シミュレーターのイベント種別 */
export const SIM_EVENT_TYPES = [
  'periodStart',
  'fieldGoal',
  'freeThrow',
  'foul',
  'violation',
  'outOfBounds',
  'steal',
  'rebound',
  'jumpBallSituation',
  'timeout',
  'substitution',
  'throwIn',
  'play',
  'periodEnd',
  'closing',
] as const
export const simEventTypeSchema = z.enum(SIM_EVENT_TYPES)
export type SimEventType = z.infer<typeof simEventTypeSchema>

export const SIM_EVENT_TYPE_LABELS: Record<SimEventType, string> = {
  periodStart: 'ピリオド開始',
  fieldGoal: 'ゴール成功',
  freeThrow: 'フリースロー',
  foul: 'ファウル',
  violation: 'バイオレーション',
  outOfBounds: 'アウトオブバウンズ',
  steal: 'スティール',
  rebound: 'リバウンド',
  jumpBallSituation: 'ヘルドボール',
  timeout: 'タイムアウト',
  substitution: '交代',
  throwIn: 'スローイン',
  play: '経過',
  periodEnd: 'ピリオド終了',
  closing: '締めの記帳',
}

/** SCオペレーターの操作（keep は「触らない＝継続」の判断） */
export const SIM_SC_ACTIONS = ['reset24', 'reset14', 'keep'] as const
export const simScActionSchema = z.enum(SIM_SC_ACTIONS)
export type SimScAction = z.infer<typeof simScActionSchema>

export const SIM_SC_ACTION_LABELS: Record<SimScAction, string> = {
  reset24: '24秒にリセット',
  reset14: '14秒にリセット',
  keep: '継続（そのまま）',
}

export const scExpectSchema = z.object({
  action: simScActionSchema,
  /** この判断の根拠（フィードバックに表示する解説） */
  explanation: z.string().min(10),
})
export type ScExpect = z.infer<typeof scExpectSchema>

export const scorerExpectSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('mark'),
    mark: placedMarkSchema,
    explanation: z.string().min(10),
  }),
  z.object({
    kind: z.literal('apArrow'),
    /** 操作後に矢印が指すチーム */
    to: teamSchema,
    explanation: z.string().min(10),
  }),
])
export type ScorerExpect = z.infer<typeof scorerExpectSchema>

/**
 * 役割ごとの期待アクション（キーが無い役割にとっては「見てるだけ」のイベント）。
 * timer / a-scorer / to-supporter は今後 optional キーを足すだけで拡張できる。
 */
export const simExpectSchema = z.object({
  'sc-operator': scExpectSchema.optional(),
  scorer: scorerExpectSchema.optional(),
})
export type SimExpect = z.infer<typeof simExpectSchema>

export const simEventSchema = z.object({
  id: z.string().regex(/^ev-\d{3}$/),
  /** このイベントが属するクォーター */
  quarter: quarterSchema,
  /** このイベント発生時点のゲームクロック残り（著述が正。Q内で非増加を検証） */
  gameClockMs: z.number().int().min(0),
  type: simEventTypeSchema,
  /** 実況テキスト（全役割共通の「見える情報」） */
  narration: z.string().min(4),
  team: teamSchema.optional(),
  playerNo: z.number().int().min(0).optional(),
  /** 得点イベントの点数（fieldGoal=2/3、freeThrow成功=1） */
  points: z.number().int().min(1).max(3).optional(),
  /**
   * 盤面のショットクロック指示: 数値=その秒にセット / hide=非表示（FT中など） / none=変化なし。
   * type: 'play'（複数ポゼッションをまとめた経過イベント）は途中のリセットを省略するため
   * 'none' 以外を指定すること（畳み込みはここから再開する）。
   */
  shot: z.union([z.enum(['none', 'hide']), z.number().int().min(1).max(24)]),
  expect: simExpectSchema,
  refs: z.array(z.string()).min(1),
})
export type SimEvent = z.infer<typeof simEventSchema>

export const gameScriptSchema = z.object({
  id: z.string().regex(/^sim-[a-z0-9-]+$/),
  title: z.string().min(4),
  description: z.string().min(10),
  ruleset: z.enum(['u12', 'general']),
  /** クォーターの長さ（U12=360000） */
  quarterMs: z.number().int().positive(),
  events: z.array(simEventSchema).min(1),
  ruleYear: z.number().int(),
})
export type GameScript = z.infer<typeof gameScriptSchema>
