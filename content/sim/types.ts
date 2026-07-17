import { z } from 'zod'
import { placedMarkSchema, quarterSchema, teamSchema } from '../drills/types'

/**
 * TOシミュレーターのGameScript（試合台本）。
 * イベントの発生時刻は「再生開始からの経過ミリ秒 atMs（1倍速の実時間）」が正で、
 * ゲームクロックはイベントの clock 指示から導出する（FT・タイムアウト中などの
 * 死に時間は atMs を圧縮して台本化できる）。gameClockMs は表示・検証用の併記で、
 * validate-content が clock 指示の畳み込みから再計算して突合する。
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
  'periodEnd',
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
  periodEnd: 'ピリオド終了',
}

/**
 * イベントに伴うクロックの動き（盤面表示は台本が正。ユーザー操作では動かさない）。
 * shot の数値はその秒へのセット（ゲームクロックが動いている間だけ減る）。
 */
export const simClockDirectiveSchema = z.object({
  /** ゲームクロック: start=動き出す / stop=止まる / none=変化なし */
  game: z.enum(['start', 'stop', 'none']),
  /** ショットクロック: 数値=その秒にセット / hide=非表示（FT中など） / none=変化なし */
  shot: z.union([z.enum(['none', 'hide']), z.number().int().min(1).max(24)]),
})
export type SimClockDirective = z.infer<typeof simClockDirectiveSchema>

/** SCオペレーターの操作（keep も「継続ボタンを押して判断を示す」ことを期待する） */
export const SIM_SC_ACTIONS = ['reset24', 'reset14', 'keep'] as const
export const simScActionSchema = z.enum(SIM_SC_ACTIONS)
export type SimScAction = z.infer<typeof simScActionSchema>

export const SIM_SC_ACTION_LABELS: Record<SimScAction, string> = {
  reset24: '24秒にリセット',
  reset14: '14秒にリセット',
  keep: '継続（そのまま）',
}

/** 照合ウィンドウの既定値（イベント発生から操作を受け付ける長さ） */
export const DEFAULT_WINDOW_MS = {
  sc: 6000,
  mark: 20000,
  apArrow: 10000,
} as const

export const scExpectSchema = z.object({
  action: simScActionSchema,
  /** 照合ウィンドウ（省略時 DEFAULT_WINDOW_MS.sc） */
  windowMs: z.number().int().min(1000).optional(),
})
export type ScExpect = z.infer<typeof scExpectSchema>

export const scorerExpectSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('mark'),
    mark: placedMarkSchema,
    windowMs: z.number().int().min(1000).optional(),
  }),
  z.object({
    kind: z.literal('apArrow'),
    /** 操作後に矢印が指すチーム */
    to: teamSchema,
    windowMs: z.number().int().min(1000).optional(),
  }),
])
export type ScorerExpect = z.infer<typeof scorerExpectSchema>

export function scWindowMs(e: ScExpect): number {
  return e.windowMs ?? DEFAULT_WINDOW_MS.sc
}

export function scorerWindowMs(e: ScorerExpect): number {
  return e.windowMs ?? (e.kind === 'mark' ? DEFAULT_WINDOW_MS.mark : DEFAULT_WINDOW_MS.apArrow)
}

/**
 * 役割ごとの期待アクション（キーが無い役割は「見てるだけ」＝照合対象外）。
 * timer / a-scorer / to-supporter は今後 optional キーを足すだけで拡張できる。
 */
export const simExpectSchema = z.object({
  'sc-operator': scExpectSchema.optional(),
  scorer: scorerExpectSchema.optional(),
})
export type SimExpect = z.infer<typeof simExpectSchema>

export const simEventSchema = z.object({
  id: z.string().regex(/^ev-\d{3}$/),
  /** 再生開始からの経過ミリ秒（1倍速の実時間・狭義単調増加） */
  atMs: z.number().int().min(0),
  /** このイベント発生時点のゲームクロック残り（検証・表示用） */
  gameClockMs: z.number().int().min(0),
  type: simEventTypeSchema,
  /** 実況テキスト（全役割共通の「見える情報」） */
  narration: z.string().min(4),
  team: teamSchema.optional(),
  playerNo: z.number().int().min(0).optional(),
  /** 得点イベントの点数（fieldGoal=2/3、freeThrow成功=1） */
  points: z.number().int().min(1).max(3).optional(),
  clock: simClockDirectiveSchema,
  expect: simExpectSchema,
  refs: z.array(z.string()).min(1),
})
export type SimEvent = z.infer<typeof simEventSchema>

export const gameScriptSchema = z.object({
  id: z.string().regex(/^sim-[a-z0-9-]+$/),
  title: z.string().min(4),
  description: z.string().min(10),
  ruleset: z.enum(['u12', 'general']),
  quarter: quarterSchema,
  /** クォーターの長さ（U12=360000） */
  quarterMs: z.number().int().positive(),
  events: z.array(simEventSchema).min(1),
  ruleYear: z.number().int(),
})
export type GameScript = z.infer<typeof gameScriptSchema>
