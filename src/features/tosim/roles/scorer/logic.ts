import type {
  CellRef,
  PlacedMark,
  SheetFragment,
  Team,
} from '../../../../../content/drills/types'
import { SHEET_SYMBOL_LABELS } from '../../../../../content/drills/types'
import type { GameScript, ScorerExpect } from '../../../../../content/sim/types'
import { PEN_COLOR_LABELS } from '../../../../lib/scoresheet'
import type { SimInput } from '../../types'

export const TEAM_LABELS: Record<Team, string> = { A: '白(A)', B: '赤(B)' }

export interface ScorerFragments {
  score: SheetFragment
  A: SheetFragment
  B: SheetFragment
}

/**
 * 台本から記入に必要なシート断片（窓）を導出する。
 * 得点窓は最終スコア＋余白、ファウル行は台本に登場する背番号＋HC、
 * タイムアウト行はU12の各Q1枠（一般は前半2・後半3）。
 */
export function scorerFragments(script: GameScript): ScorerFragments {
  const totals: Record<Team, number> = { A: 0, B: 0 }
  const players: Record<Team, Set<string>> = { A: new Set(), B: new Set() }
  for (const e of script.events) {
    if (e.team && e.playerNo !== undefined) players[e.team].add(String(e.playerNo))
    if (e.points !== undefined && e.team) totals[e.team] += e.points
  }
  const timeoutRows =
    script.ruleset === 'u12'
      ? [
          { label: '第1Q', slots: 1 },
          { label: '第2Q', slots: 1 },
          { label: '第3Q', slots: 1 },
          { label: '第4Q', slots: 1 },
        ]
      : [
          { label: '前半', slots: 2 },
          { label: '後半', slots: 3 },
        ]
  const teamFragment = (team: Team): SheetFragment => ({
    fouls: {
      team,
      rows: [
        ...[...players[team]]
          .sort((a, b) => Number(a) - Number(b))
          .map((label) => ({ label, slots: 5 })),
        { label: 'HC', slots: 5 },
      ],
    },
    timeouts: { team, rows: timeoutRows },
  })
  return {
    score: { score: { from: 1, to: Math.max(totals.A, totals.B) + 2 } },
    A: teamFragment('A'),
    B: teamFragment('B'),
  }
}

/** フィードバックの「正しい記入例」用に、期待セルの周辺だけの小さな窓を作る */
export function exampleFragment(cell: CellRef): SheetFragment {
  switch (cell.kind) {
    case 'score':
      return { score: { from: Math.max(1, cell.score - 2), to: cell.score + 1 } }
    case 'foul':
      return { fouls: { team: cell.team, rows: [{ label: cell.row, slots: 5 }] } }
    case 'timeout':
      return { timeouts: { team: cell.team, rows: [{ label: cell.row, slots: cell.slot }] } }
  }
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
