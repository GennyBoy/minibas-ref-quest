import { useMemo, useState } from 'react'
import type { CellRef, PenColor, Team } from '../../../../../content/drills/types'
import ClockDisplay from '../../../../components/ClockDisplay'
import PenToggle from '../../../../components/scoresheet/PenToggle'
import ScoreSheetGrid from '../../../../components/scoresheet/ScoreSheetGrid'
import SymbolPalette, { type PaletteValue } from '../../../../components/scoresheet/SymbolPalette'
import type { SimPanelProps } from '../registry'
import { TEAM_LABELS, confirmedMarks, currentArrow, scorerFragments } from './logic'

const VIEWS = [
  { id: 'score', label: '🏀 得点' },
  { id: 'A', label: '白のF・TO' },
  { id: 'B', label: '赤のF・TO' },
] as const
type ViewId = (typeof VIEWS)[number]['id']

const EMPTY_PALETTE: PaletteValue = { symbol: null, subscript: null, value: null }

/**
 * スコアラーの操作パネル。ScoreSheetGrid はチームA/Bタブで出し分け、
 * 記入フロー（①マス→②記号→③色→④記入）は DrillSheet と同じ組み立て。
 * 確定済みの記入は期待マークを自動転記する（盤面は台本が正）。
 */
export default function ScorerPanel({ state, gameText, shotText, onInput, disabled }: SimPanelProps) {
  const [view, setView] = useState<ViewId>('score')
  // ペンは持ち替えるまでそのまま（実際のスコアラーと同じ）。濃色スタートで持ち替えを問う
  const [pen, setPen] = useState<PenColor>('dark')
  const [selectedCell, setSelectedCell] = useState<CellRef | null>(null)
  const [palette, setPalette] = useState<PaletteValue>(EMPTY_PALETTE)
  const [scoreCat, setScoreCat] = useState<'score' | 'closing'>('score')

  const fragments = useMemo(() => scorerFragments(state.script), [state.script])
  const marks = confirmedMarks(state.results)
  const arrow = currentArrow(state.results)

  const fragment = view === 'score' ? fragments.score : view === 'A' ? fragments.A : fragments.B
  const category =
    selectedCell === null
      ? null
      : selectedCell.kind === 'score'
        ? scoreCat
        : selectedCell.kind === 'foul'
          ? 'foul'
          : 'timeout'

  const complete =
    selectedCell !== null && palette.symbol !== null && (category !== 'timeout' || palette.value !== null)

  function switchView(v: ViewId) {
    setView(v)
    setSelectedCell(null)
    setPalette(EMPTY_PALETTE)
  }

  function selectCell(cell: CellRef) {
    setSelectedCell(cell)
    setScoreCat('score')
    setPalette(cell.kind === 'timeout' ? { ...EMPTY_PALETTE, symbol: 'timeout' } : EMPTY_PALETTE)
  }

  function submit() {
    if (disabled || !complete || !selectedCell || !palette.symbol) return
    onInput({
      kind: 'mark',
      mark: {
        cell: selectedCell,
        mark: {
          symbol: palette.symbol,
          subscript: palette.subscript ?? undefined,
          value: palette.value ?? undefined,
        },
        color: pen,
      },
    })
    setSelectedCell(null)
    setPalette(EMPTY_PALETTE)
  }

  function setArrow(to: Team) {
    if (disabled) return
    onInput({ kind: 'apArrow', to })
  }

  return (
    <div className="space-y-3">
      <ClockDisplay gameText={gameText} shotText={shotText} size="sm" />

      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-xs font-bold text-slate-600">
          🔄 APアロー:{' '}
          <span className="text-orange-600">{arrow ? `${TEAM_LABELS[arrow]}方向` : '未設定'}</span>
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setArrow('A')}
            disabled={disabled}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 active:scale-[0.97] disabled:opacity-40"
          >
            ◀ 白へ
          </button>
          <button
            type="button"
            onClick={() => setArrow('B')}
            disabled={disabled}
            className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-black text-rose-700 active:scale-[0.97] disabled:opacity-40"
          >
            赤へ ▶
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 text-xs">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => switchView(v.id)}
            className={`flex-1 rounded-full px-2 py-1.5 font-bold ${
              view === v.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 shadow-sm'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <ScoreSheetGrid
        fragment={fragment}
        marks={marks}
        selectedCell={selectedCell}
        onCellTap={selectCell}
      />

      {selectedCell?.kind === 'score' && (
        <div className="flex gap-1.5 text-xs">
          {(
            [
              ['score', '得点の記号'],
              ['closing', '締め（Q/ゲーム終了）'],
            ] as ['score' | 'closing', string][]
          ).map(([cat, label]) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setScoreCat(cat)
                setPalette(EMPTY_PALETTE)
              }}
              className={`rounded-full px-3 py-1.5 font-bold ${
                scoreCat === cat ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {category !== null ? (
        <SymbolPalette
          category={category}
          ruleset={state.script.ruleset}
          value={palette}
          onChange={setPalette}
        />
      ) : (
        <p className="text-center text-[11px] text-slate-400">
          記入するマスをタップ → 記号 → ペンの色 → ✍️ 記入する
        </p>
      )}
      <PenToggle color={pen} onChange={setPen} />

      <button
        type="button"
        disabled={!complete || disabled}
        onClick={submit}
        className={`block w-full rounded-2xl p-4 text-center font-black shadow active:scale-[0.99] ${
          complete && !disabled ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
        }`}
      >
        ✍️ 記入する
      </button>
    </div>
  )
}
