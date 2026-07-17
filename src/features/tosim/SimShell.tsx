import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import type { GameScript } from '../../../content/sim/types'
import type { PenColor } from '../../../content/drills/types'
import { formatGameClock } from '../../lib/clock'
import type { SimInput } from './types'
import type { GradeResult } from './roles/graders'
import { gradeInput } from './roles/graders'
import type { SimRolePlugin } from './roles/registry'
import type { SimSegment } from './steps'
import { boardBefore, buildSession, segmentLabel } from './steps'
import SimResult from './SimResult'

export interface SimAnswer {
  input: SimInput
  grade: GradeResult
}

/**
 * ターン制セッションの共通枠: 実況カード → 役割パネル → 答え合わせ → 次へ。
 * 役割ごとの操作UI・答え合わせ表示は plugin.Panel / plugin.Feedback に委譲する。
 */
export default function SimShell({
  script,
  plugin,
  segment,
  onRetry,
  onChangeSegment,
}: {
  script: GameScript
  plugin: SimRolePlugin
  segment: SimSegment
  onRetry: () => void
  onChangeSegment: () => void
}) {
  const plan = useMemo(() => buildSession(script, plugin.role, segment), [script, plugin, segment])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question')
  const [answers, setAnswers] = useState<SimAnswer[]>([])
  const [pen, setPen] = useState<PenColor>(plan.initialPen)

  const backHref = `/to/${plugin.role}`

  if (plan.steps.length === 0) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="inline-block text-sm text-slate-500">
          ← {ROLE_LABELS[plugin.role]}ハブ
        </Link>
        <p className="py-16 text-center text-sm text-slate-500">
          {segmentLabel(segment)}には{ROLE_LABELS[plugin.role]}の出番がまだありません
        </p>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <SimResult
        script={script}
        plugin={plugin}
        plan={plan}
        answers={answers}
        onRetry={onRetry}
        onChangeSegment={onChangeSegment}
      />
    )
  }

  const step = plan.steps[idx]
  // 盤面は台本が正: このイベントより前の全期待マークから導出（締めだけモードにも対応）
  const board = boardBefore(script, step.event)
  const answer = answers[idx]
  const showFeedback = phase === 'feedback' && answer !== undefined
  const streak = currentStreak(answers)

  function submit(input: SimInput) {
    if (phase !== 'question') return
    const grade = gradeInput(step.expect, input)
    setAnswers((a) => [...a, { input, grade }])
    setPhase('feedback')
  }

  function next() {
    if (idx + 1 >= plan.steps.length) {
      setPhase('done')
    } else {
      setIdx(idx + 1)
      setPhase('question')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link href={backHref}>← やめる</Link>
        <span>
          {segmentLabel(segment)} {idx + 1} / {plan.steps.length}
          {streak >= 2 && <span className="ml-2 font-bold text-orange-500">🔥{streak}連続</span>}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full bg-orange-500 transition-all"
          style={{ width: `${((idx + (showFeedback ? 1 : 0)) / plan.steps.length) * 100}%` }}
        />
      </div>

      {/* 実況カード */}
      <div key={step.event.id} className="rounded-2xl bg-white p-4 shadow-sm animate-quiz-pop">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
            第{step.event.quarter}Q
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
            残り {formatGameClock(step.event.gameClockMs)}
          </span>
        </div>
        {step.between.length > 0 ? (
          <ul className="mb-2 space-y-0.5 border-l-2 border-slate-100 pl-2 text-[11px] leading-relaxed text-slate-400">
            {step.between.map((e) => (
              <li key={e.id}>{e.narration}</li>
            ))}
          </ul>
        ) : (
          step.prev && (
            <p className="mb-2 border-l-2 border-slate-100 pl-2 text-[11px] leading-relaxed text-slate-400">
              直前: {step.prev.narration}
            </p>
          )
        )}
        <p className="font-medium leading-relaxed">📣 {step.event.narration}</p>
      </div>

      {!showFeedback && (
        <plugin.Panel
          key={step.event.id}
          step={step}
          script={script}
          board={board}
          pen={pen}
          setPen={setPen}
          onSubmit={submit}
        />
      )}

      {showFeedback && (
        <div
          className={`rounded-2xl p-4 shadow-sm ${answer.grade.correct ? 'bg-emerald-50' : 'bg-rose-50'}`}
        >
          <span
            className={`font-black ${answer.grade.correct ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {answer.grade.correct ? '⭕ 正解！' : '❌ 不正解'}
          </span>
          <div className="mt-2">
            <plugin.Feedback
              step={step}
              input={answer.input}
              grade={answer.grade}
              script={script}
              board={board}
            />
          </div>
          <button
            type="button"
            onClick={next}
            className="mt-3 block w-full rounded-xl bg-slate-800 p-3.5 text-center font-bold text-white active:scale-[0.99]"
          >
            {idx + 1 >= plan.steps.length ? '結果を見る' : '次の場面へ'}
          </button>
        </div>
      )}
    </div>
  )
}

function currentStreak(answers: SimAnswer[]): number {
  let n = 0
  for (let i = answers.length - 1; i >= 0; i--) {
    if (!answers[i].grade.correct) break
    n++
  }
  return n
}
