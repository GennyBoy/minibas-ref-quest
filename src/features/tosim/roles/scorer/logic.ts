import type {
  CellRef,
  PlacedMark,
  SheetFragment,
  Team,
} from '../../../../../content/drills/types'
import { SHEET_SYMBOL_LABELS } from '../../../../../content/drills/types'
import type { GameScript, ScorerExpect } from '../../../../../content/sim/types'
import { PEN_COLOR_LABELS } from '../../../../lib/scoresheet'
import type { SimEventResult } from '../../engine'
import type { SimInput } from '../../types'

export const TEAM_LABELS: Record<Team, string> = { A: '白(A)', B: '赤(B)' }

const QUARTER_LABELS = { 1: '第1Q', 2: '第2Q', 3: '第3Q', 4: '第4Q', OT: 'OT' } as const

export interface ScorerFragments {
  score: SheetFragment
  A: SheetFragment
  B: SheetFragment
}

/**
 * 台本から記入に必要なシート断片（窓）を導出する。
 * 得点窓は最終スコア＋余白、ファウル行は台本に登場する背番号、
 * タイムアウト行はこのクォーターの枠（U12は各Q1回）。
 */
export function scorerFragments(script: GameScript): ScorerFragments {
  const totals: Record<Team, number> = { A: 0, B: 0 }
  const players: Record<Team, Set<string>> = { A: new Set(), B: new Set() }
  for (const e of script.events) {
    if (e.team && e.playerNo !== undefined) players[e.team].add(String(e.playerNo))
    if (e.points !== undefined && e.team) totals[e.team] += e.points
  }
  const teamFragment = (team: Team): SheetFragment => ({
    fouls: {
      team,
      rows: [...players[team]]
        .sort((a, b) => Number(a) - Number(b))
        .map((label) => ({ label, slots: 5 })),
    },
    timeouts: {
      team,
      rows: [{ label: QUARTER_LABELS[script.quarter], slots: script.ruleset === 'u12' ? 1 : 3 }],
    },
  })
  return {
    score: { score: { from: 1, to: Math.max(totals.A, totals.B) + 2 } },
    A: teamFragment('A'),
    B: teamFragment('B'),
  }
}

/** 盤面転記用: ウィンドウ確定済みイベントの期待マーク（盤面は台本が正） */
export function confirmedMarks(results: SimEventResult[]): PlacedMark[] {
  const marks: PlacedMark[] = []
  for (const r of results) {
    if (!('action' in r.expect) && r.expect.kind === 'mark') marks.push(r.expect.mark)
  }
  return marks
}

/** 確定済みイベントから現在のAPアローの向きを導く（未設定は null） */
export function currentArrow(results: SimEventResult[]): Team | null {
  let arrow: Team | null = null
  for (const r of results) {
    if (!('action' in r.expect) && r.expect.kind === 'apArrow') arrow = r.expect.to
  }
  return arrow
}

function cellLabel(cell: CellRef): string {
  switch (cell.kind) {
    case 'score':
      return `${TEAM_LABELS[cell.team]}の${cell.score}点目`
    case 'foul':
      return `${TEAM_LABELS[cell.team]}${cell.row === 'HC' ? 'HC' : `${cell.row}番`}のファウル枠${cell.slot}`
    case 'timeout':
      return `${TEAM_LABELS[cell.team]}のタイムアウト欄（${cell.row}）`
  }
}

export function describeMark(m: PlacedMark): string {
  const extra =
    m.mark.subscript !== undefined
      ? `・FT${m.mark.subscript}本の添え字`
      : m.mark.value !== undefined
        ? `・経過${m.mark.value}分`
        : ''
  return `${cellLabel(m.cell)}に「${SHEET_SYMBOL_LABELS[m.mark.symbol]}」${extra}・${PEN_COLOR_LABELS[m.color]}ペン`
}

export function describeScorerExpect(expect: ScorerExpect): string {
  return expect.kind === 'mark'
    ? describeMark(expect.mark)
    : `APアローを${TEAM_LABELS[expect.to]}方向へセット`
}

export function describeScorerInput(input: SimInput): string {
  if (input.kind === 'mark') return describeMark(input.mark)
  if (input.kind === 'apArrow') return `APアローを${TEAM_LABELS[input.to]}方向へセット`
  return '(不明な操作)'
}
