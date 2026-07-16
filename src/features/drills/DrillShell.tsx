import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import { useProgress } from '../../stores/progress'
import {
  tallyDrill,
  isNewBest,
  drillXp,
  drillBestKey,
  DRILL_MODE_LABELS,
  type DrillAnswerLog,
  type DrillMode,
} from '../../lib/drill'
import { useClock } from './useClock'
import type { DrillMeta } from './registry'

export interface DrillShellProps {
  meta: DrillMeta
  mode: DrillMode
  /** 出題数 */
  steps: number
  timeLimitMs: number
  /** 出題エリア。回答したら submit(correct) を呼ぶ */
  renderQuestion: (idx: number, submit: (correct: boolean) => void) => ReactNode
  /** フィードバックカードの中身（解説・根拠など） */
  renderFeedback: (idx: number, log: DrillAnswerLog) => ReactNode
  onRetry: () => void
  onChangeMode: () => void
}

/**
 * ドリル共通のセッション進行: 制限時間バー・ストリーク・タイムアウト処理・
 * 結果画面（スコア・自己ベスト・XP）・progressストアへの記録。
 */
export default function DrillShell({
  meta,
  mode,
  steps,
  timeLimitMs,
  renderQuestion,
  renderFeedback,
  onRetry,
  onChangeMode,
}: DrillShellProps) {
  const bestKey = drillBestKey(meta.id, mode)
  const recordDrill = useProgress((s) => s.recordDrill)

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question')
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const [logs, setLogs] = useState<DrillAnswerLog[]>([])
  const [final, setFinal] = useState<{
    correct: number
    total: number
    bestStreak: number
    avgReactionMs: number | null
    score: number
    xp: number
    newBest: boolean
  } | null>(null)

  const timer = useClock(timeLimitMs, (ms) => (ms / 1000).toFixed(1), {
    onZero: () => {
      // 時間切れ = 誤答扱い
      if (phaseRef.current !== 'question') return
      setLogs((l) => [...l, { correct: false, reactionMs: timeLimitMs, timedOut: true }])
      setPhase('feedback')
    },
  })
  const { reset: resetTimer, start: startTimer } = timer

  useEffect(() => {
    if (phase === 'question') resetTimer(timeLimitMs, true)
  }, [idx, phase, timeLimitMs, resetTimer])

  function submit(correct: boolean) {
    if (phase !== 'question') return
    const reactionMs = Math.min(timeLimitMs, Math.max(0, timeLimitMs - timer.msLeft))
    timer.stop()
    setLogs((l) => [...l, { correct, reactionMs, timedOut: false }])
    setPhase('feedback')
  }

  function next() {
    if (idx + 1 >= steps) {
      const score = tallyDrill(logs, timeLimitMs)
      const prev = useProgress.getState().drillBest[bestKey]
      const newBest = isNewBest(prev, score)
      const xp = drillXp(score, newBest)
      recordDrill(bestKey, meta.id, meta.role, score, xp, Date.now())
      setFinal({ ...score, xp, newBest })
      setPhase('done')
    } else {
      setIdx(idx + 1)
      setPhase('question')
    }
  }

  const backHref = `/to/${meta.role}`
  const streak = currentStreak(logs)

  if (phase === 'done' && final) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            {meta.icon} {meta.title}（{DRILL_MODE_LABELS[mode]}） 結果
          </p>
          <p className="mt-3 text-5xl font-black text-orange-600">
            {final.score}
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
                {final.correct}
                <span className="text-xs text-slate-400">/{final.total}</span>
              </p>
              <p className="text-[10px] text-slate-500">正解</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="font-black text-slate-700">🔥{final.bestStreak}</p>
              <p className="text-[10px] text-slate-500">最大連続</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <p className="font-black text-slate-700">
                {final.avgReactionMs !== null ? `${(final.avgReactionMs / 1000).toFixed(1)}秒` : '—'}
              </p>
              <p className="text-[10px] text-slate-500">平均反応</p>
            </div>
          </div>
          <p className="mt-3 font-bold text-emerald-600">+{final.xp} XP</p>
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
          onClick={onChangeMode}
          className="block w-full rounded-2xl bg-white p-4 text-center font-bold text-slate-600 shadow-sm active:scale-[0.99]"
        >
          モードを変える
        </button>
        <Link
          href={backHref}
          className="block w-full rounded-2xl bg-white p-4 text-center font-bold text-slate-600 shadow-sm active:scale-[0.99]"
        >
          {ROLE_LABELS[meta.role]}ハブへ戻る
        </Link>
      </div>
    )
  }

  const showFeedback = phase === 'feedback'
  const lastLog = logs[logs.length - 1]
  const timeRatio = timeLimitMs > 0 ? timer.msLeft / timeLimitMs : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link href={backHref}>← やめる</Link>
        <span>
          {DRILL_MODE_LABELS[mode]}モード {Math.min(idx + 1, steps)} / {steps} 問
          {streak >= 2 && <span className="ml-2 font-bold text-orange-500">🔥{streak}連続</span>}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full bg-orange-500 transition-all"
          style={{ width: `${((idx + (showFeedback ? 1 : 0)) / steps) * 100}%` }}
        />
      </div>

      {!showFeedback && (
        <div className="relative">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full ${timeRatio < 0.4 ? 'bg-rose-500' : 'bg-orange-400'}`}
              style={{ width: `${timeRatio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] font-bold text-slate-400">
            あと {timer.text} 秒
          </p>
        </div>
      )}

      {renderQuestion(idx, submit)}

      {timer.pausedByHidden && !showFeedback && (
        <button
          type="button"
          onClick={startTimer}
          className="block w-full rounded-2xl bg-slate-800 p-4 text-center font-bold text-white active:scale-[0.99]"
        >
          ⏸ 一時停止中 — タップで再開
        </button>
      )}

      {showFeedback && lastLog && (
        <div
          className={`rounded-2xl p-4 shadow-sm ${lastLog.correct ? 'bg-emerald-50' : 'bg-rose-50'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-black ${lastLog.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
              {lastLog.correct ? '⭕ 正解！' : lastLog.timedOut ? '⏰ 時間切れ' : '❌ 不正解'}
            </span>
            {!lastLog.timedOut && (
              <span className="text-xs font-bold text-slate-500">
                反応 {(lastLog.reactionMs / 1000).toFixed(1)}秒
              </span>
            )}
          </div>
          <div className="mt-2">{renderFeedback(idx, lastLog)}</div>
          <button
            type="button"
            onClick={next}
            className="mt-3 block w-full rounded-xl bg-slate-800 p-3.5 text-center font-bold text-white active:scale-[0.99]"
          >
            {idx + 1 >= steps ? '結果を見る' : '次の問題へ'}
          </button>
        </div>
      )}
    </div>
  )
}

function currentStreak(logs: DrillAnswerLog[]): number {
  let n = 0
  for (let i = logs.length - 1; i >= 0; i--) {
    if (!logs[i].correct) break
    n++
  }
  return n
}
