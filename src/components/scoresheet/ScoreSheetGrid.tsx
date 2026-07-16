import type { ReactNode } from 'react'
import type { CellRef, PlacedMark, SheetFragment, SheetMark, PenColor } from '../../../content/drills/types'
import { cellKey } from '../../lib/scoresheet'

/**
 * タップ記入できる簡略スコアシート（独自様式・公式様式の複製ではない）。
 * fragment で指定された窓（ランニングスコア／ファウル欄／タイムアウト欄）だけを
 * 44px以上のセルで描画する。readOnly でクイズの場面図としても使える。
 */

export interface CellHighlight {
  cell: CellRef
  tone: 'correct' | 'wrong' | 'expected'
}

export interface ScoreSheetGridProps {
  fragment: SheetFragment
  marks: PlacedMark[]
  readOnly?: boolean
  selectedCell?: CellRef | null
  onCellTap?: (cell: CellRef) => void
  highlights?: CellHighlight[]
}

const TONE_CLS: Record<CellHighlight['tone'], string> = {
  correct: 'ring-2 ring-emerald-500 animate-quiz-pop',
  wrong: 'ring-2 ring-rose-500 animate-quiz-shake',
  expected: 'ring-2 ring-emerald-500 bg-emerald-50',
}

function inkCls(color: PenColor): string {
  return color === 'red' ? 'text-red-600' : 'text-slate-900'
}

/** セル内の記号描画 */
function MarkGlyph({ mark, color }: { mark: SheetMark; color: PenColor }) {
  const ink = inkCls(color)
  switch (mark.symbol) {
    case 'ft':
      return (
        <span
          className={`absolute inset-1 flex items-center justify-center rounded-full ${
            color === 'red' ? 'bg-red-600' : 'bg-slate-900'
          } text-xs font-black text-white`}
        >
          {/* ●: 数字を塗りつぶす */}
        </span>
      )
    case 'fg':
    case 'fg3':
    case 'ownGoal':
      return (
        <span
          className={`absolute left-1/2 top-1/2 h-[120%] w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ${
            color === 'red' ? 'bg-red-600' : 'bg-slate-900'
          }`}
        />
      )
    case 'closeQ':
      // Q終了: 最後の得点を太い○で囲み、下に太線1本
      return (
        <span className={ink}>
          <span className="absolute inset-1 rounded-full border-[3px] border-current" />
          <span className="absolute -bottom-px left-0 right-0 h-[3px] bg-current" />
        </span>
      )
    case 'closeGame':
      // ゲーム終了: ○囲み＋太線2本
      return (
        <span className={ink}>
          <span className="absolute inset-1 rounded-full border-[3px] border-current" />
          <span className="absolute bottom-1 left-0 right-0 h-[3px] bg-current" />
          <span className="absolute -bottom-px left-0 right-0 h-[3px] bg-current" />
        </span>
      )
    case 'timeout':
      return (
        <span className={`absolute inset-0 flex items-center justify-center text-base font-black ${ink}`}>
          {mark.value}
        </span>
      )
    default:
      // ファウル記号（P/T/U/C/B/M）＋FT本数の添え字
      return (
        <span className={`absolute inset-0 flex items-center justify-center text-base font-black ${ink}`}>
          {mark.symbol}
          {mark.subscript !== undefined && (
            <sub className="text-[9px] font-bold">{mark.subscript}</sub>
          )}
        </span>
      )
  }
}

/** 得点セルの隣（番号列）に出す表示 */
function playerNoLabel(mark: SheetMark, color: PenColor): ReactNode {
  const ink = inkCls(color)
  if (mark.symbol === 'ownGoal') return <span className={`font-black ${ink}`}>▲</span>
  if (mark.playerNo === undefined) return null
  if (mark.symbol === 'fg3') {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs font-black ${ink}`}
      >
        {mark.playerNo}
      </span>
    )
  }
  return <span className={`text-xs font-black ${ink}`}>{mark.playerNo}</span>
}

export default function ScoreSheetGrid({
  fragment,
  marks,
  readOnly,
  selectedCell,
  onCellTap,
  highlights,
}: ScoreSheetGridProps) {
  const markMap = new Map(marks.map((m) => [cellKey(m.cell), m]))
  const highlightMap = new Map((highlights ?? []).map((h) => [cellKey(h.cell), h.tone]))
  const selectedKey = selectedCell ? cellKey(selectedCell) : null

  function cellCls(cell: CellRef, base: string): string {
    const key = cellKey(cell)
    const tone = highlightMap.get(key)
    const selected = key === selectedKey
    return [
      base,
      'relative border border-slate-300 bg-white',
      tone ? TONE_CLS[tone] : '',
      selected && !tone ? 'ring-2 ring-orange-500 z-10' : '',
      !readOnly ? 'active:bg-orange-50' : '',
    ].join(' ')
  }

  function Cell({ cell, children }: { cell: CellRef; children: ReactNode }) {
    if (readOnly) {
      return <div className={cellCls(cell, 'flex min-h-11 items-center justify-center')}>{children}</div>
    }
    return (
      <button
        type="button"
        onClick={() => onCellTap?.(cell)}
        className={cellCls(cell, 'flex min-h-11 items-center justify-center')}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
      {fragment.score && (
        <div>
          <div className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr] text-center text-[10px] font-bold text-slate-500">
            <div>番号</div>
            <div>白（A）</div>
            <div>赤（B）</div>
            <div>番号</div>
          </div>
          {Array.from(
            { length: fragment.score.to - fragment.score.from + 1 },
            (_, i) => fragment.score!.from + i,
          ).map((score) => {
            const cellA: CellRef = { kind: 'score', team: 'A', score }
            const cellB: CellRef = { kind: 'score', team: 'B', score }
            const markA = markMap.get(cellKey(cellA))
            const markB = markMap.get(cellKey(cellB))
            return (
              <div key={score} className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr]">
                <div className="flex min-h-11 items-center justify-center border border-slate-200 bg-slate-50">
                  {markA && playerNoLabel(markA.mark, markA.color)}
                </div>
                <Cell cell={cellA}>
                  <span className="text-sm text-slate-400">{score}</span>
                  {markA && <MarkGlyph mark={markA.mark} color={markA.color} />}
                  {markA?.mark.symbol === 'ft' && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center text-xs font-black text-white">
                      {score}
                    </span>
                  )}
                </Cell>
                <Cell cell={cellB}>
                  <span className="text-sm text-slate-400">{score}</span>
                  {markB && <MarkGlyph mark={markB.mark} color={markB.color} />}
                  {markB?.mark.symbol === 'ft' && (
                    <span className="absolute inset-0 z-10 flex items-center justify-center text-xs font-black text-white">
                      {score}
                    </span>
                  )}
                </Cell>
                <div className="flex min-h-11 items-center justify-center border border-slate-200 bg-slate-50">
                  {markB && playerNoLabel(markB.mark, markB.color)}
                </div>
              </div>
            )
          })}
          {(fragment.score.to - fragment.score.from) < 30 && (
            <p className="mt-1 text-center text-[10px] text-slate-400">
              …ランニングスコアの一部を表示しています…
            </p>
          )}
        </div>
      )}

      {fragment.fouls && (
        <div>
          <p className="mb-1 text-[10px] font-bold text-slate-500">
            ファウル欄（{fragment.fouls.team === 'A' ? '白' : '赤'}チーム）
          </p>
          {fragment.fouls.rows.map((row) => (
            <div key={row.label} className="flex items-stretch">
              <div className="flex min-h-11 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                {row.label === 'HC' ? 'HC' : `${row.label}番`}
              </div>
              {Array.from({ length: row.slots }, (_, i) => i + 1).map((slot) => {
                const cell: CellRef = {
                  kind: 'foul',
                  team: fragment.fouls!.team,
                  row: row.label,
                  slot,
                }
                const mark = markMap.get(cellKey(cell))
                return (
                  <div key={slot} className="min-w-11 flex-1">
                    <Cell cell={cell}>
                      {mark && <MarkGlyph mark={mark.mark} color={mark.color} />}
                    </Cell>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {fragment.timeouts && (
        <div>
          <p className="mb-1 text-[10px] font-bold text-slate-500">
            タイムアウト欄（{fragment.timeouts.team === 'A' ? '白' : '赤'}チーム）
          </p>
          {fragment.timeouts.rows.map((row) => (
            <div key={row.label} className="flex items-stretch">
              <div className="flex min-h-11 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                {row.label}
              </div>
              {Array.from({ length: row.slots }, (_, i) => i + 1).map((slot) => {
                const cell: CellRef = {
                  kind: 'timeout',
                  team: fragment.timeouts!.team,
                  row: row.label,
                  slot,
                }
                const mark = markMap.get(cellKey(cell))
                return (
                  <div key={slot} className="min-w-11 flex-1">
                    <Cell cell={cell}>
                      {mark && <MarkGlyph mark={mark.mark} color={mark.color} />}
                    </Cell>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
