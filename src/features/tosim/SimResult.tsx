import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import type { GameScript } from '../../../content/sim/types'
import { formatGameClock } from '../../lib/clock'
import { isNewSimBest, simBestKey, simXp, tallySimSteps } from '../../lib/sim'
import { useProgress } from '../../stores/progress'
import type { SimAnswer } from './SimShell'
import type { SimRolePlugin } from './roles/registry'
import type { SimSessionPlan, SimStep } from './steps'
import { segmentLabel } from './steps'

type Filter = 'all' | 'wrong'

export default function SimResult({
  script,
  plugin,
  plan,
  answers,
  onRetry,
  onChangeSegment,
}: {
  script: GameScript
  plugin: SimRolePlugin
  plan: SimSessionPlan
  answers: SimAnswer[]
  onRetry: () => void
  onChangeSegment: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [final] = useState(() => {
    const summary = tallySimSteps(answers.map((a) => ({ correct: a.grade.correct })))
    const key = simBestKey(script.id, plugin.role, plan.segment)
    const newBest = isNewSimBest(useProgress.getState().drillBest[key], summary)
    return { summary, key, newBest, xp: simXp(summary, newBest) }
  })

  // StrictMode の二重実行でも1回だけ記録する
  const recorded = useRef(false)
  useEffect(() => {
    if (recorded.current) return
    recorded.current = true
    useProgress
      .getState()
      .recordSim(final.key, script.id, plugin.role, final.summary, final.xp, Date.now())
  }, [final, script.id, plugin.role])

  const rows = plan.steps.map((step, i) => ({ step, answer: answers[i] }))
  const visible = rows.filter((r) => filter === 'all' || !r.answer?.grade.correct)
  const s = final.summary

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          {plugin.icon} {script.title}（{ROLE_LABELS[plugin.role]}・{segmentLabel(plan.segment)}）
          結果
        </p>
        <p className="mt-3 text-5xl font-black text-orange-600">
          {s.score}
          <span className="ml-1 text-lg text-slate-400">点</span>
        </p>
        {final.newBest && (
          <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700 animate-quiz-pop">
            🏆 自己ベスト更新！
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-black text-slate-700">
              {s.correct}
              <span className="text-xs text-slate-400">/{s.total}</span>
            </p>
            <p className="text-[10px] text-slate-500">正解</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-black text-slate-700">{s.wrong}</p>
            <p className="text-[10px] text-slate-500">ミス</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-black text-slate-700">🔥{s.bestStreak}</p>
            <p className="text-[10px] text-slate-500">最大連続</p>
          </div>
        </div>
        <p className="mt-3 font-bold text-emerald-600">+{final.xp} XP</p>
        {plan.epilogue.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            その後: {plan.epilogue.map((e) => e.narration).join(' ／ ')}
          </p>
        )}
      </div>

      <div className="flex gap-2 text-sm">
        {(
          [
            ['all', 'すべて'],
            ['wrong', '❌ ミスだけ'],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 font-bold ${
              filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 shadow-sm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">ミスなし！全問正解 🎉</p>
        )}
        {visible.map(({ step, answer }) => (
          <ResultRow key={step.event.id} step={step} answer={answer} plugin={plugin} />
        ))}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="block w-full rounded-2xl bg-orange-500 p-4 text-center font-black text-white shadow active:scale-[0.99]"
      >
        もう一度挑戦する
      </button>
      <button
        type="button"
        onClick={onChangeSegment}
        className="block w-full rounded-2xl bg-white p-4 text-center font-bold text-slate-600 shadow-sm active:scale-[0.99]"
      >
        区分を変える（通し / Q別）
      </button>
      <Link
        href={`/to/${plugin.role}`}
        className="block w-full rounded-2xl bg-white p-4 text-center font-bold text-slate-600 shadow-sm active:scale-[0.99]"
      >
        {ROLE_LABELS[plugin.role]}ハブへ戻る
      </Link>
    </div>
  )
}

function ResultRow({
  step,
  answer,
  plugin,
}: {
  step: SimStep
  answer: SimAnswer | undefined
  plugin: SimRolePlugin
}) {
  const correct = answer?.grade.correct ?? false
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          第{step.event.quarter}Q 残り {formatGameClock(step.event.gameClockMs)}
        </span>
        <span className={`font-bold ${correct ? 'text-emerald-600' : 'text-rose-600'}`}>
          {correct ? '⭕ 正解' : '❌ ミス'}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium leading-relaxed">{step.event.narration}</p>
      <p className="mt-1 text-xs text-slate-600">
        正解: <b>{plugin.describeExpect(step.expect)}</b>
      </p>
      {!correct && answer && (
        <p className="mt-0.5 text-xs text-rose-600">あなた: {plugin.describeInput(answer.input)}</p>
      )}
      {!correct && (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{step.explanation}</p>
      )}
    </div>
  )
}
