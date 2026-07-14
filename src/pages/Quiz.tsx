import { useState } from 'react'
import { Link, useParams } from 'wouter'
import {
  TO_ROLES,
  ROLE_LABELS,
  DOMAIN_LABELS,
  type Question,
  type ToRole,
} from '../../content'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'
import { questionPool } from '../features/quiz/pool'
import { buildSession } from '../lib/session'
import { isDue } from '../lib/srs'
import { questionXp, COMBO_BONUS } from '../lib/xp'

interface QuestionMeta {
  wasDue: boolean
  firstSeen: boolean
}

interface AnswerResult {
  question: Question
  correct: boolean
  xpGained: number
}

export default function Quiz() {
  const params = useParams<{ role?: string }>()
  const role = (TO_ROLES.find((r) => r === params.role) ?? null) as ToRole | null
  const ruleset = useSettings((s) => s.ruleset)
  const questionsPerSession = useSettings((s) => s.questionsPerSession)
  const [nonce, setNonce] = useState(0)
  return (
    <QuizSession
      key={nonce}
      role={role}
      ruleset={ruleset}
      count={questionsPerSession}
      onRetry={() => setNonce((n) => n + 1)}
    />
  )
}

function QuizSession({
  role,
  ruleset,
  count,
  onRetry,
}: {
  role: ToRole | null
  ruleset: 'u12' | 'general'
  count: number
  onRetry: () => void
}) {
  const answerQuestion = useProgress((s) => s.answer)
  const recordSession = useProgress((s) => s.recordSession)

  const [session] = useState<{ questions: Question[]; meta: QuestionMeta[] }>(() => {
    const now = Date.now()
    const srs = useProgress.getState().srs
    const questions = buildSession(questionPool(ruleset), srs, role, now, count)
    const meta = questions.map((q) => ({
      wasDue: isDue(srs[q.id], now),
      firstSeen: !srs[q.id],
    }))
    return { questions, meta }
  })

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question')
  const [results, setResults] = useState<AnswerResult[]>([])
  const [streak, setStreak] = useState(0)
  const [comboBonus, setComboBonus] = useState(0)
  const [lastChoice, setLastChoice] = useState<number | boolean | null>(null)

  const { questions, meta } = session
  const q = questions[idx]

  if (questions.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>出題できる問題がありません</p>
        <Link href="/" className="mt-4 inline-block text-orange-600 underline">
          ホームへ
        </Link>
      </div>
    )
  }

  const backHref = role ? `/to/${role}` : '/'

  function handleAnswer(choice: number | boolean) {
    if (phase !== 'question') return
    const correct = q.type === 'single' ? choice === q.answer : choice === q.answer
    const newStreak = correct ? streak + 1 : 0
    const xpGained = questionXp({
      difficulty: q.difficulty,
      correct,
      wasDue: meta[idx].wasDue,
      firstSeen: meta[idx].firstSeen,
      streak: newStreak,
      comboBonusSoFar: comboBonus,
    })
    if (correct && newStreak % 3 === 0 && comboBonus < 20) setComboBonus((b) => b + COMBO_BONUS)
    setStreak(newStreak)
    answerQuestion(q.id, correct, xpGained, Date.now())
    setResults((r) => [...r, { question: q, correct, xpGained }])
    setLastChoice(choice)
    setPhase('feedback')
  }

  function next() {
    if (idx + 1 >= questions.length) {
      const correct = results.filter((r) => r.correct).length
      recordSession({
        at: Date.now(),
        role,
        correct,
        total: results.length,
        xpGained: results.reduce((sum, r) => sum + r.xpGained, 0),
      })
      setPhase('done')
    } else {
      setIdx(idx + 1)
      setLastChoice(null)
      setPhase('question')
    }
  }

  if (phase === 'done') {
    const correct = results.filter((r) => r.correct).length
    const xpTotal = results.reduce((sum, r) => sum + r.xpGained, 0)
    const wrong = results.filter((r) => !r.correct)
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            {role ? `${ROLE_LABELS[role]}クイズ` : '復習クイズ'} 結果
          </p>
          <p className="mt-2 text-4xl font-black text-orange-600">
            {correct} <span className="text-lg text-slate-400">/ {results.length} 問正解</span>
          </p>
          <p className="mt-2 font-bold text-emerald-600">+{xpTotal} XP</p>
          {wrong.length === 0 && <p className="mt-2 text-sm">🎉 全問正解！</p>}
        </div>

        {wrong.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-bold text-rose-600">
              間違えた問題（明日また出題されます）
            </h2>
            <ul className="space-y-3">
              {wrong.map((r) => (
                <li key={r.question.id} className="border-l-2 border-rose-300 pl-3 text-sm">
                  <p className="font-medium">{r.question.prompt}</p>
                  <p className="mt-1 text-xs text-slate-500">{r.question.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button
          type="button"
          onClick={onRetry}
          className="block w-full rounded-2xl bg-orange-500 p-4 text-center font-black text-white shadow active:scale-[0.99]"
        >
          もう一度挑戦する
        </button>
        <Link
          href={backHref}
          className="block w-full rounded-2xl bg-white p-4 text-center font-bold text-slate-600 shadow-sm active:scale-[0.99]"
        >
          {role ? `${ROLE_LABELS[role]}ハブへ戻る` : 'ホームへ戻る'}
        </Link>
      </div>
    )
  }

  const result = results[results.length - 1]
  const showFeedback = phase === 'feedback'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link href={backHref}>← やめる</Link>
        <span>
          {idx + 1} / {questions.length} 問
          {streak >= 2 && <span className="ml-2 font-bold text-orange-500">🔥{streak}連続</span>}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full bg-orange-500 transition-all"
          style={{ width: `${((idx + (showFeedback ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
            {DOMAIN_LABELS[q.domain]}
          </span>
          {q.ruleset === 'u12' && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">U12</span>
          )}
          {q.ruleset === 'general' && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">一般</span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
            {'★'.repeat(q.difficulty)}
          </span>
          {meta[idx].wasDue && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">復習</span>
          )}
        </div>
        <p className="font-medium leading-relaxed">{q.prompt}</p>
      </div>

      <div className="space-y-2.5">
        {q.type === 'single' &&
          q.choices.map((choice, i) => {
            let style = 'bg-white text-slate-700'
            if (showFeedback) {
              if (i === q.answer) style = 'bg-emerald-500 text-white'
              else if (lastChoice === i) style = 'bg-rose-400 text-white'
              else style = 'bg-white text-slate-400'
            }
            return (
              <button
                key={i}
                type="button"
                disabled={showFeedback}
                onClick={() => handleAnswer(i)}
                className={`block min-h-12 w-full rounded-2xl p-3.5 text-left text-sm font-medium shadow-sm transition-colors active:scale-[0.99] ${style}`}
              >
                {choice}
              </button>
            )
          })}
        {q.type === 'truefalse' && (
          <div className="grid grid-cols-2 gap-2.5">
            {([true, false] as const).map((v) => {
              let style = 'bg-white text-slate-700'
              if (showFeedback) {
                if (v === q.answer) style = 'bg-emerald-500 text-white'
                else if (lastChoice === v) style = 'bg-rose-400 text-white'
                else style = 'bg-white text-slate-400'
              }
              return (
                <button
                  key={String(v)}
                  type="button"
                  disabled={showFeedback}
                  onClick={() => handleAnswer(v)}
                  className={`min-h-16 rounded-2xl p-3 text-center shadow-sm transition-colors active:scale-[0.99] ${style}`}
                >
                  <span className="block text-2xl font-black">{v ? '○' : '×'}</span>
                  <span className="text-xs">{v ? '正しい' : '間違い'}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showFeedback && result && (
        <div
          className={`rounded-2xl p-4 shadow-sm ${
            result.correct ? 'bg-emerald-50' : 'bg-rose-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-black ${result.correct ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {result.correct ? '⭕ 正解！' : '❌ 不正解'}
            </span>
            <span className="text-sm font-bold text-emerald-600">+{result.xpGained} XP</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{q.explanation}</p>
          <p className="mt-2 text-[11px] text-slate-400">根拠: {q.refs.join('、')}</p>
          <button
            type="button"
            onClick={next}
            className="mt-3 block w-full rounded-xl bg-slate-800 p-3.5 text-center font-bold text-white active:scale-[0.99]"
          >
            {idx + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
          </button>
        </div>
      )}
    </div>
  )
}
