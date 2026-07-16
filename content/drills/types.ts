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

/** タイマードリルの3アクション */
export const GAME_CLOCK_ACTIONS = ['start', 'stop', 'none'] as const
export const gameClockActionSchema = z.enum(GAME_CLOCK_ACTIONS)
export type GameClockAction = z.infer<typeof gameClockActionSchema>

export const GAME_CLOCK_ACTION_LABELS: Record<GameClockAction, string> = {
  start: 'スタート',
  stop: 'ストップ',
  none: '何もしない',
}

/** ゲームクロック判断ケース */
export const gameClockCaseSchema = z.object({
  id: z.string().regex(/^gc-\d{3}$/),
  situation: z.string().min(8),
  /** 出題時のクロック演出（残り時間・動いているか・ピリオド表示） */
  clock: z.object({
    gameMs: z.number().int().min(0),
    running: z.boolean(),
    quarter: z.string().optional(),
  }),
  answer: z.object({
    u12: gameClockActionSchema,
    general: gameClockActionSchema,
  }),
  explanation: z.string().min(10),
  refs: z.array(z.string()).min(1),
  ruleYear: z.number().int(),
})
export type GameClockCase = z.infer<typeof gameClockCaseSchema>

// ===== スコアシート記入ドリル =====
// チームは A=白 / B=赤 に固定した簡略様式（公式様式の複製はしない）

export const quarterSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal('OT'),
])
export type Quarter = z.infer<typeof quarterSchema>

export const penColorSchema = z.enum(['red', 'dark'])
export type PenColor = z.infer<typeof penColorSchema>

export const teamSchema = z.enum(['A', 'B'])
export type Team = z.infer<typeof teamSchema>

/**
 * 記入記号。ft=●(FT1点) fg=／(FG2点) fg3=／+番号○囲み(一般3点)
 * ownGoal=▲(U12オウンゴール) P/T/U/C/B/M=ファウル
 * timeout=経過分数 closeQ=Q終了の締め(太線1本) closeGame=ゲーム終了の締め(太線2本)
 */
export const SHEET_SYMBOLS = [
  'ft',
  'fg',
  'fg3',
  'ownGoal',
  'P',
  'T',
  'U',
  'C',
  'B',
  'M',
  'timeout',
  'closeQ',
  'closeGame',
] as const
export const sheetSymbolSchema = z.enum(SHEET_SYMBOLS)
export type SheetSymbol = z.infer<typeof sheetSymbolSchema>

export const SHEET_SYMBOL_LABELS: Record<SheetSymbol, string> = {
  ft: '● フリースロー（1点）',
  fg: '／ フィールドゴール（2点）',
  fg3: '／＋番号を○囲み（3点）',
  ownGoal: '▲ オウンゴール',
  P: 'P パーソナル',
  T: 'T テクニカル（プレーヤー）',
  U: 'U アンスポーツマンライク',
  C: 'C HC自身のテクニカル',
  B: 'B ベンチテクニカル',
  M: 'M マンツーマンペナルティ',
  timeout: 'タイムアウト（経過分）',
  closeQ: 'Q終了の締め（太線1本）',
  closeGame: 'ゲーム終了の締め（太線2本）',
}

export const cellRefSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('score'),
    team: teamSchema,
    score: z.number().int().min(1).max(200),
  }),
  z.object({
    kind: z.literal('foul'),
    team: teamSchema,
    /** プレーヤー番号 or 'HC' */
    row: z.string(),
    slot: z.number().int().min(1).max(5),
  }),
  z.object({
    kind: z.literal('timeout'),
    team: teamSchema,
    /** 行ラベル（U12: '第1Q' 等 / 一般: '前半'・'後半'） */
    row: z.string(),
    slot: z.number().int().min(1).max(3),
  }),
])
export type CellRef = z.infer<typeof cellRefSchema>

export const sheetMarkSchema = z.object({
  symbol: sheetSymbolSchema,
  /** 得点欄の隣に書くプレーヤー番号（出題から自動記入・採点対象外） */
  playerNo: z.number().int().optional(),
  /** ファウル記号の右下に添えるFT本数 */
  subscript: z.number().int().min(1).max(3).optional(),
  /** タイムアウトの経過分数 */
  value: z.number().int().min(1).max(10).optional(),
})
export type SheetMark = z.infer<typeof sheetMarkSchema>

export const placedMarkSchema = z.object({
  cell: cellRefSchema,
  mark: sheetMarkSchema,
  color: penColorSchema,
})
export type PlacedMark = z.infer<typeof placedMarkSchema>

/** 描画するシートの断片（全シートは描かず、出題に必要な窓だけ描く） */
export const sheetFragmentSchema = z.object({
  score: z.object({ from: z.number().int().min(1), to: z.number().int().min(1) }).optional(),
  fouls: z
    .object({
      team: teamSchema,
      rows: z.array(z.object({ label: z.string(), slots: z.number().int().min(1).max(5) })),
    })
    .optional(),
  timeouts: z
    .object({
      team: teamSchema,
      rows: z.array(z.object({ label: z.string(), slots: z.number().int().min(1).max(3) })),
    })
    .optional(),
})
export type SheetFragment = z.infer<typeof sheetFragmentSchema>

export const SHEET_CATEGORIES = ['score', 'foul', 'timeout', 'closing'] as const
export const sheetCategorySchema = z.enum(SHEET_CATEGORIES)
export type SheetCategory = z.infer<typeof sheetCategorySchema>

export const sheetTaskSchema = z.object({
  id: z.string().regex(/^sh-\d{3}$/),
  category: sheetCategorySchema,
  ruleset: z.enum(['u12', 'general', 'both']),
  quarter: quarterSchema,
  prompt: z.string().min(8),
  /** タイムアウト問題の計算材料（Q時間・成立時の残り秒） */
  context: z
    .object({ quarterMin: z.number().int(), remainingSec: z.number().int().min(0) })
    .optional(),
  fragment: sheetFragmentSchema,
  prefill: z.array(placedMarkSchema),
  expected: placedMarkSchema,
  explanation: z.string().min(10),
  refs: z.array(z.string()).min(1),
  ruleYear: z.number().int(),
})
export type SheetTask = z.infer<typeof sheetTaskSchema>

/** U12と一般で答えが分かれるケースか（くらべるモードの出題対象） */
export function isDivergent(c: { answer: { u12: string; general: string } }): boolean {
  return c.answer.u12 !== c.answer.general
}

/** ドリルコンテンツ全体の検証（validate-content から呼ぶ） */
export function validateDrillContent(content: {
  shotClockCases?: ShotClockCase[]
  gameClockCases?: GameClockCase[]
  sheetTasks?: SheetTask[]
}): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  const check = (items: { id?: string }[], schema: z.ZodType) => {
    for (const c of items) {
      const result = schema.safeParse(c)
      if (!result.success) {
        errors.push(`${c.id ?? '(no id)'}: ${result.error.issues.map((i) => i.message).join(', ')}`)
        continue
      }
      if (c.id) {
        if (seen.has(c.id)) errors.push(`${c.id}: ID重複`)
        seen.add(c.id)
      }
    }
  }
  check(content.shotClockCases ?? [], shotClockCaseSchema)
  check(content.gameClockCases ?? [], gameClockCaseSchema)
  check(content.sheetTasks ?? [], sheetTaskSchema)
  return errors
}
