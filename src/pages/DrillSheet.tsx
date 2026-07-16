import { useState } from 'react'
import {
  sheetTasks,
  SHEET_SYMBOL_LABELS,
  type CellRef,
  type PlacedMark,
  type SheetTask,
} from '../../content/drills'
import { useSettings } from '../stores/settings'
import { shuffle } from '../lib/session'
import { type DrillMode } from '../lib/drill'
import { gradeEntry, PEN_COLOR_LABELS, type EntryGrade } from '../lib/scoresheet'
import { DRILLS } from '../features/drills/registry'
import DrillShell from '../features/drills/DrillShell'
import ModePicker from '../features/drills/ModePicker'
import RefsLine from '../features/drills/RefsLine'
import ScoreSheetGrid from '../components/scoresheet/ScoreSheetGrid'
import SymbolPalette, { type PaletteValue } from '../components/scoresheet/SymbolPalette'
import PenToggle from '../components/scoresheet/PenToggle'
import type { PenColor } from '../../content/drills/types'

const META = DRILLS.find((d) => d.id === 'sheet')!

const QUESTIONS_PER_SESSION = 8

const QUARTER_LABELS = { 1: '第1Q', 2: '第2Q', 3: '第3Q', 4: '第4Q', OT: 'OT' } as const

const CATEGORY_LABELS = {
  score: '得点',
  foul: 'ファウル',
  timeout: 'タイムアウト',
  closing: '締め',
} as const

export default function DrillSheet() {
  const defaultRuleset = useSettings((s) => s.ruleset)
  const [mode, setMode] = useState<DrillMode | null>(null)
  const [nonce, setNonce] = useState(0)

  if (mode === null) {
    return (
      <ModePicker
        meta={META}
        lead={`お題どおりに、正しいマスへ正しい記号を正しいペンの色で記入。全${QUESTIONS_PER_SESSION}問`}
        modes={[
          {
            mode: 'u12',
            title: '📝 U12（ミニバス）',
            description: '▲（オウンゴール）・M（マンツー）などU12様式で練習',
            highlight: defaultRuleset === 'u12',
          },
          {
            mode: 'general',
            title: '📝 一般（5人制）',
            description: '3点の○囲み・スローインファウルなど一般様式で練習',
            highlight: defaultRuleset === 'general',
          },
        ]}
        onPick={setMode}
      />
    )
  }
  return (
    <SheetSession
      key={`${mode}-${nonce}`}
      mode={mode}
      onRetry={() => setNonce((n) => n + 1)}
      onChangeMode={() => setMode(null)}
    />
  )
}

function buildTasks(mode: DrillMode): SheetTask[] {
  const ruleset = mode === 'general' ? 'general' : 'u12'
  const pool = sheetTasks.filter((t) => t.ruleset === ruleset || t.ruleset === 'both')
  return shuffle(pool).slice(0, QUESTIONS_PER_SESSION)
}

function SheetSession({
  mode,
  onRetry,
  onChangeMode,
}: {
  mode: DrillMode
  onRetry: () => void
  onChangeMode: () => void
}) {
  const ruleset = mode === 'general' ? 'general' : 'u12'
  const [tasks] = useState(() => buildTasks(mode))
  // ペンは持ち替えるまでそのまま（実際のスコアラーと同じ）。事前記入は濃色から始まる
  const [pen, setPen] = useState<PenColor>('dark')
  const [grades, setGrades] = useState<(EntryGrade | null)[]>([])
  const [answers, setAnswers] = useState<(PlacedMark | null)[]>([])

  return (
    <DrillShell
      meta={META}
      mode={mode}
      steps={tasks.length}
      timeLimitMs={META.timeLimitMs}
      onRetry={onRetry}
      onChangeMode={onChangeMode}
      renderQuestion={(idx, submit) => (
        <SheetQuestion
          key={idx}
          task={tasks[idx]}
          ruleset={ruleset}
          pen={pen}
          setPen={setPen}
          onSubmit={(actual) => {
            const grade = gradeEntry(tasks[idx].expected, actual)
            setGrades((g) => {
              const copy = [...g]
              copy[idx] = grade
              return copy
            })
            setAnswers((a) => {
              const copy = [...a]
              copy[idx] = actual
              return copy
            })
            submit(grade.all)
          }}
        />
      )}
      renderFeedback={(idx) => {
        const task = tasks[idx]
        const grade = grades[idx] ?? null
        const answer = answers[idx] ?? null
        return (
          <div className="space-y-2 text-sm">
            {grade && !grade.all && (
              <ul className="grid grid-cols-2 gap-1 text-xs font-bold">
                <li className={grade.cell ? 'text-emerald-600' : 'text-rose-600'}>
                  {grade.cell ? '✓' : '✗'} マス（記入場所）
                </li>
                <li className={grade.symbol ? 'text-emerald-600' : 'text-rose-600'}>
                  {grade.symbol ? '✓' : '✗'} 記号
                </li>
                <li className={grade.detail ? 'text-emerald-600' : 'text-rose-600'}>
                  {grade.detail ? '✓' : '✗'} 添え数字
                </li>
                <li className={grade.color ? 'text-emerald-600' : 'text-rose-600'}>
                  {grade.color ? '✓' : '✗'} ペンの色
                </li>
              </ul>
            )}
            {!grade && <p className="text-xs font-bold text-rose-600">時間切れ（記入なし）</p>}
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">正しい記入例:</p>
              <ScoreSheetGrid
                fragment={task.fragment}
                marks={[...task.prefill, task.expected]}
                readOnly
                highlights={[{ cell: task.expected.cell, tone: 'expected' }]}
              />
              <p className="mt-1 text-xs font-bold text-slate-600">
                {SHEET_SYMBOL_LABELS[task.expected.mark.symbol]}
                {task.expected.mark.subscript !== undefined &&
                  `＋FT${task.expected.mark.subscript}本の添え字`}
                ・{PEN_COLOR_LABELS[task.expected.color]}ペン
              </p>
              {answer && !grade?.all && answer.mark.symbol !== task.expected.mark.symbol && (
                <p className="mt-0.5 text-xs text-rose-500">
                  あなたの記入: {SHEET_SYMBOL_LABELS[answer.mark.symbol]}・
                  {PEN_COLOR_LABELS[answer.color]}ペン
                </p>
              )}
            </div>
            <p className="leading-relaxed text-slate-700">{task.explanation}</p>
            <RefsLine refs={task.refs} />
          </div>
        )
      }}
    />
  )
}

function SheetQuestion({
  task,
  ruleset,
  pen,
  setPen,
  onSubmit,
}: {
  task: SheetTask
  ruleset: 'u12' | 'general'
  pen: PenColor
  setPen: (c: PenColor) => void
  onSubmit: (actual: PlacedMark) => void
}) {
  const [selectedCell, setSelectedCell] = useState<CellRef | null>(null)
  const [palette, setPalette] = useState<PaletteValue>({
    symbol: task.category === 'timeout' ? 'timeout' : null,
    subscript: null,
    value: null,
  })

  const complete =
    selectedCell !== null &&
    palette.symbol !== null &&
    (task.category !== 'timeout' || palette.value !== null)

  function handleSubmit() {
    if (!complete || !selectedCell || !palette.symbol) return
    onSubmit({
      cell: selectedCell,
      mark: {
        symbol: palette.symbol,
        // プレーヤー番号は出題から自動記入（採点対象外）
        playerNo: task.expected.mark.playerNo,
        subscript: palette.subscript ?? undefined,
        value: palette.value ?? undefined,
      },
      color: pen,
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-1.5 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
            {QUARTER_LABELS[task.quarter]}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
            {CATEGORY_LABELS[task.category]}
          </span>
        </div>
        <p className="font-medium leading-relaxed">{task.prompt}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          ① マスをタップ → ② 記号を選ぶ → ③ ペンの色 → ④ 記入する
        </p>
      </div>

      <ScoreSheetGrid
        fragment={task.fragment}
        marks={task.prefill}
        selectedCell={selectedCell}
        onCellTap={setSelectedCell}
      />

      <SymbolPalette category={task.category} ruleset={ruleset} value={palette} onChange={setPalette} />
      <PenToggle color={pen} onChange={setPen} />

      <button
        type="button"
        disabled={!complete}
        onClick={handleSubmit}
        className={`block w-full rounded-2xl p-4 text-center font-black shadow active:scale-[0.99] ${
          complete ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'
        }`}
      >
        ✍️ 記入する
      </button>
    </div>
  )
}
