import { SHEET_SYMBOL_LABELS } from '../../../../../content/drills/types'
import ScoreSheetGrid from '../../../../components/scoresheet/ScoreSheetGrid'
import { PEN_COLOR_LABELS } from '../../../../lib/scoresheet'
import RefsLine from '../../../drills/RefsLine'
import type { SimFeedbackProps } from '../registry'
import { TEAM_LABELS, exampleFragment } from './logic'

export default function ScorerFeedback({ step, input, grade, board }: SimFeedbackProps) {
  const expect = step.expect
  if ('action' in expect) return null

  if (expect.kind === 'apArrow') {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-bold text-slate-700">
          正解: APアローを{TEAM_LABELS[expect.to]}方向へ
          {!grade.correct && input.kind === 'apArrow' && (
            <span className="ml-2 font-medium text-rose-500">
              （あなた: {TEAM_LABELS[input.to]}方向）
            </span>
          )}
        </p>
        <p className="leading-relaxed text-slate-700">{step.explanation}</p>
        <RefsLine refs={step.event.refs} />
      </div>
    )
  }

  const g = grade.entryGrade
  return (
    <div className="space-y-2 text-sm">
      {g && !g.all && (
        <ul className="grid grid-cols-2 gap-1 text-xs font-bold">
          <li className={g.cell ? 'text-emerald-600' : 'text-rose-600'}>
            {g.cell ? '✓' : '✗'} マス（記入場所）
          </li>
          <li className={g.symbol ? 'text-emerald-600' : 'text-rose-600'}>
            {g.symbol ? '✓' : '✗'} 記号
          </li>
          <li className={g.detail ? 'text-emerald-600' : 'text-rose-600'}>
            {g.detail ? '✓' : '✗'} 添え数字
          </li>
          <li className={g.color ? 'text-emerald-600' : 'text-rose-600'}>
            {g.color ? '✓' : '✗'} ペンの色
          </li>
        </ul>
      )}
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">正しい記入例:</p>
        <ScoreSheetGrid
          fragment={exampleFragment(expect.mark.cell)}
          marks={[...board.marks, expect.mark]}
          readOnly
          highlights={[{ cell: expect.mark.cell, tone: 'expected' }]}
        />
        <p className="mt-1 text-xs font-bold text-slate-600">
          {SHEET_SYMBOL_LABELS[expect.mark.mark.symbol]}
          {expect.mark.mark.subscript !== undefined &&
            `＋FT${expect.mark.mark.subscript}本の添え字`}
          ・{PEN_COLOR_LABELS[expect.mark.color]}ペン
        </p>
        {input.kind === 'mark' && !g?.all && input.mark.mark.symbol !== expect.mark.mark.symbol && (
          <p className="mt-0.5 text-xs text-rose-500">
            あなたの記入: {SHEET_SYMBOL_LABELS[input.mark.mark.symbol]}・
            {PEN_COLOR_LABELS[input.mark.color]}ペン
          </p>
        )}
      </div>
      <p className="leading-relaxed text-slate-700">{step.explanation}</p>
      <RefsLine refs={step.event.refs} />
    </div>
  )
}
