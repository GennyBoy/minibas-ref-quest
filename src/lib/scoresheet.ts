import type {
  CellRef,
  PenColor,
  PlacedMark,
  Quarter,
  SheetTask,
  Team,
} from '../../content/drills/types'

/**
 * スコアシート記入の純ロジック。
 * 根拠: knowledge/08-to-scoresheet（ペンの色ルール・タイムアウトの経過分・ファウル枠）
 */

/** 赤=第1Q・第3Q / 濃色=第2Q・第4Q・OT（OTは第4Q扱い） */
export function penColorForQuarter(q: Quarter): PenColor {
  return q === 1 || q === 3 ? 'red' : 'dark'
}

export const PEN_COLOR_LABELS: Record<PenColor, string> = {
  red: '赤',
  dark: '濃色（青/黒）',
}

/**
 * タイムアウト枠に書く「経過時間（分・切り上げ）」。
 * 例: U12(6分Q)残り2:35 → 205秒経過 → 4 ／ 一般(10分Q)残り3:44 → 376秒経過 → 7
 */
export function timeoutMinute(quarterMin: number, remainingSec: number): number {
  const elapsedSec = quarterMin * 60 - remainingSec
  return Math.ceil(elapsedSec / 60)
}

/** セルの同一性判定用キー */
export function cellKey(c: CellRef): string {
  switch (c.kind) {
    case 'score':
      return `score/${c.team}/${c.score}`
    case 'foul':
      return `foul/${c.team}/${c.row}/${c.slot}`
    case 'timeout':
      return `timeout/${c.team}/${c.row}/${c.slot}`
  }
}

/** prefill を踏まえて、次に記入すべきファウル枠（左から詰める） */
export function nextFoulSlot(prefill: PlacedMark[], team: Team, row: string): number {
  const used = prefill.filter(
    (m) => m.cell.kind === 'foul' && m.cell.team === team && m.cell.row === row,
  ).length
  return used + 1
}

export interface EntryGrade {
  /** 正しいセル（枠）を選べたか */
  cell: boolean
  /** 正しい記号を選べたか */
  symbol: boolean
  /** 添え数字（FT本数・経過分）が正しいか */
  detail: boolean
  /** ペンの色が正しいか */
  color: boolean
  all: boolean
}

/** 記入の採点。playerNo は出題から自動記入されるため採点しない */
export function gradeEntry(expected: PlacedMark, actual: PlacedMark): EntryGrade {
  const cell = cellKey(expected.cell) === cellKey(actual.cell)
  const symbol = expected.mark.symbol === actual.mark.symbol
  const detail =
    expected.mark.subscript === actual.mark.subscript && expected.mark.value === actual.mark.value
  const color = expected.color === actual.color
  return { cell, symbol, detail, color, all: cell && symbol && detail && color }
}

/**
 * シートタスクの整合性検証（スキーマより強い、記入ルール由来の不変条件）。
 * validate-content スクリプトとテストの両方から使う。
 */
export function validateSheetTasks(tasks: SheetTask[]): string[] {
  const errors: string[] = []
  for (const t of tasks) {
    // ペンの色はクォーターから一意に決まる
    const pen = penColorForQuarter(t.quarter)
    if (t.expected.color !== pen) {
      errors.push(`${t.id}: expected.color が ${t.expected.color}（第${t.quarter}Qは ${pen}）`)
    }
    // ファウルは prefill の次の枠に記入する
    if (t.expected.cell.kind === 'foul') {
      const slot = nextFoulSlot(t.prefill, t.expected.cell.team, t.expected.cell.row)
      if (t.expected.cell.slot !== slot) {
        errors.push(`${t.id}: ファウル枠が slot${t.expected.cell.slot}（prefillから導くと slot${slot}）`)
      }
    }
    // タイムアウトの経過分は context から再計算して一致すること
    if (t.category === 'timeout') {
      if (!t.context) {
        errors.push(`${t.id}: timeout タスクに context がありません`)
      } else {
        const min = timeoutMinute(t.context.quarterMin, t.context.remainingSec)
        if (t.expected.mark.value !== min) {
          errors.push(`${t.id}: 経過分が ${t.expected.mark.value}（計算では ${min}）`)
        }
      }
    }
    // ルールセット限定記号: ▲・M は U12、3点○囲みは一般
    const sym = t.expected.mark.symbol
    if ((sym === 'ownGoal' || sym === 'M') && t.ruleset === 'general') {
      errors.push(`${t.id}: ${sym} はU12の記号（ruleset: general になっている）`)
    }
    if (sym === 'fg3' && t.ruleset === 'u12') {
      errors.push(`${t.id}: fg3 は一般の記号（U12は3点なし）`)
    }
    // expected セルが fragment の描画範囲に収まっていること
    const c = t.expected.cell
    if (c.kind === 'score') {
      const s = t.fragment.score
      if (!s || c.score < s.from || c.score > s.to) {
        errors.push(`${t.id}: score ${c.score} が fragment の範囲外`)
      }
    }
    if (c.kind === 'foul') {
      const f = t.fragment.fouls
      const row = f?.team === c.team ? f.rows.find((r) => r.label === c.row) : undefined
      if (!row || c.slot > row.slots) errors.push(`${t.id}: ファウル行/枠が fragment にありません`)
    }
    if (c.kind === 'timeout') {
      const f = t.fragment.timeouts
      const row = f?.team === c.team ? f.rows.find((r) => r.label === c.row) : undefined
      if (!row || c.slot > row.slots) {
        errors.push(`${t.id}: タイムアウト行/枠が fragment にありません`)
      }
    }
  }
  return errors
}
