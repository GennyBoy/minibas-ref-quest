import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import {
  shotClockCases,
  isDivergent,
  SHOT_CLOCK_ACTION_LABELS,
  type ShotClockAction,
  type ShotClockCase,
} from '../../content/drills'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'
import { chapterBySlug } from '../features/rules/chapters'
import { shuffle } from '../lib/session'
import { drillBestKey, type DrillMode } from '../lib/drill'
import { formatShotClock } from '../lib/clock'
import { useClock } from '../features/drills/useClock'
import { DRILLS } from '../features/drills/registry'
import DrillShell from '../features/drills/DrillShell'
import ClockDisplay from '../components/ClockDisplay'

const META = DRILLS.find((d) => d.id === 'shotclock')!

const QUESTIONS_PER_SESSION = 10
/** くらべるモードは同一場面をU12→一般の順に2回出題する */
const COMPARE_PAIRS = 5

interface Step {
  c: ShotClockCase
  ruleset: 'u12' | 'general'
}

const ACTION_BUTTONS: {
  action: ShotClockAction
  main: string
  sub: string
  cls: string
}[] = [
  { action: 'reset24', main: '24', sub: 'リセット', cls: 'bg-sky-500' },
  { action: 'reset14', main: '14', sub: 'リセット', cls: 'bg-violet-500' },
  { action: 'keep', main: '⏵', sub: '継続', cls: 'bg-emerald-500' },
  { action: 'stopOnly', main: '✋', sub: '止めるだけ', cls: 'bg-slate-600' },
]

export default function DrillShotClock() {
  const defaultRuleset = useSettings((s) => s.ruleset)
  const [mode, setMode] = useState<DrillMode | null>(null)
  const [nonce, setNonce] = useState(0)

  if (mode === null) {
    return <ModePicker defaultRuleset={defaultRuleset} onPick={setMode} />
  }
  return (
    <ShotClockSession
      key={`${mode}-${nonce}`}
      mode={mode}
      onRetry={() => setNonce((n) => n + 1)}
      onChangeMode={() => setMode(null)}
    />
  )
}

function ModePicker({
  defaultRuleset,
  onPick,
}: {
  defaultRuleset: 'u12' | 'general'
  onPick: (m: DrillMode) => void
}) {
  const drillBest = useProgress((s) => s.drillBest)
  const divergentCount = shotClockCases.filter(isDivergent).length
  const modes: { mode: DrillMode; title: string; description: string; highlight: boolean }[] = [
    {
      mode: 'u12',
      title: '🏀 U12（ミニバス）',
      description: 'ミニバスのルールで判断する',
      highlight: defaultRuleset === 'u12',
    },
    {
      mode: 'general',
      title: '🏀 一般（5人制）',
      description: '一般ルール（フロントコートあり）で判断する',
      highlight: defaultRuleset === 'general',
    },
    {
      mode: 'compare',
      title: '⚡ くらべるモード',
      description: `同じ場面でU12と一般の答えが変わる${divergentCount}ケースを交互に判断`,
      highlight: false,
    },
  ]
  return (
    <div className="space-y-4">
      <Link href={`/to/${META.role}`} className="inline-block text-sm text-slate-500">
        ← SCオペレーターハブ
      </Link>
      <header className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="text-4xl">{META.icon}</div>
        <h1 className="mt-1 text-lg font-black">{META.title}</h1>
        <p className="mt-1 text-xs text-slate-500">
          場面を見て「24 / 14 / 継続 / 止めるだけ」を{META.timeLimitMs / 1000}
          秒以内に判断。全{QUESTIONS_PER_SESSION}問
        </p>
      </header>
      <div className="space-y-2.5">
        {modes.map(({ mode, title, description, highlight }) => {
          const best = drillBest[drillBestKey('shotclock', mode)]
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onPick(mode)}
              className={`block w-full rounded-2xl p-4 text-left shadow-sm active:scale-[0.99] ${
                highlight ? 'bg-orange-500 text-white' : 'bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black">{title}</span>
                {best && (
                  <span
                    className={`text-xs font-bold ${highlight ? 'text-orange-100' : 'text-amber-600'}`}
                  >
                    🏆 {best.score}点
                  </span>
                )}
              </div>
              <p className={`mt-1 text-xs ${highlight ? 'text-orange-100' : 'text-slate-500'}`}>
                {description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildSteps(mode: DrillMode): Step[] {
  if (mode === 'compare') {
    const cases = shuffle(shotClockCases.filter(isDivergent)).slice(0, COMPARE_PAIRS)
    return cases.flatMap((c): Step[] => [
      { c, ruleset: 'u12' },
      { c, ruleset: 'general' },
    ])
  }
  return shuffle(shotClockCases)
    .slice(0, QUESTIONS_PER_SESSION)
    .map((c) => ({ c, ruleset: mode }))
}

function ShotClockSession({
  mode,
  onRetry,
  onChangeMode,
}: {
  mode: DrillMode
  onRetry: () => void
  onChangeMode: () => void
}) {
  const [steps] = useState(() => buildSteps(mode))
  const [picks, setPicks] = useState<(ShotClockAction | null)[]>([])

  return (
    <DrillShell
      meta={META}
      mode={mode}
      steps={steps.length}
      timeLimitMs={META.timeLimitMs}
      onRetry={onRetry}
      onChangeMode={onChangeMode}
      renderQuestion={(idx, submit) => {
        const step = steps[idx]
        const expected = step.c.answer[step.ruleset]
        return (
          <div className="space-y-3">
            <AmbientShotClock key={idx} seconds={step.c.shotClockBefore} />
            {mode === 'compare' && (
              <p className="text-center text-sm font-black text-orange-600">
                {step.ruleset === 'u12' ? 'この場面、U12なら？' : '同じ場面、一般なら？'}
              </p>
            )}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              {mode !== 'compare' && (
                <span
                  className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    step.ruleset === 'u12' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {step.ruleset === 'u12' ? 'U12' : '一般'}
                </span>
              )}
              <p className="font-medium leading-relaxed">{step.c.situation}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {ACTION_BUTTONS.map(({ action, main, sub, cls }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    setPicks((p) => {
                      const copy = [...p]
                      copy[idx] = action
                      return copy
                    })
                    submit(action === expected)
                  }}
                  className={`min-h-20 rounded-2xl p-3 text-center text-white shadow-sm transition active:scale-[0.97] ${cls}`}
                >
                  <span className="block text-3xl font-black leading-none">{main}</span>
                  <span className="mt-1 block text-xs font-bold">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }}
      renderFeedback={(idx, log) => {
        const step = steps[idx]
        const expected = step.c.answer[step.ruleset]
        const picked = picks[idx] ?? null
        const showCompareCards = mode === 'compare' && step.ruleset === 'general'
        return (
          <div className="space-y-2 text-sm">
            <p className="font-bold text-slate-700">
              正解: {SHOT_CLOCK_ACTION_LABELS[expected]}
              {!log.correct && picked && (
                <span className="ml-2 font-medium text-rose-500">
                  （あなた: {SHOT_CLOCK_ACTION_LABELS[picked]}）
                </span>
              )}
            </p>
            {showCompareCards && (
              <div>
                <p className="mb-1 text-center text-xs font-black text-orange-600">
                  ⚡ 同じ場面でも答えがちがう！
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border-2 border-sky-300 bg-sky-50 p-2 text-center">
                    <p className="text-[11px] font-bold text-sky-700">U12</p>
                    <p className="mt-0.5 font-black text-sky-800">
                      {SHOT_CLOCK_ACTION_LABELS[step.c.answer.u12]}
                    </p>
                  </div>
                  <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-2 text-center">
                    <p className="text-[11px] font-bold text-slate-600">一般</p>
                    <p className="mt-0.5 font-black text-slate-800">
                      {SHOT_CLOCK_ACTION_LABELS[step.c.answer.general]}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <p className="leading-relaxed text-slate-700">{step.c.explanation}</p>
            <RefsLine refs={step.c.refs} />
          </div>
        )
      }}
    />
  )
}

/** 出題中に実際に残り秒数が減っていく演出用クロック */
function AmbientShotClock({ seconds }: { seconds: number }) {
  const clock = useClock(seconds * 1000, formatShotClock)
  const { start } = clock
  useEffect(() => {
    start()
  }, [start])
  return <ClockDisplay shotText={clock.text} />
}

function RefsLine({ refs }: { refs: string[] }) {
  return (
    <p className="text-[11px] text-slate-400">
      根拠:{' '}
      {refs.map((ref, i) => {
        const slug = ref.match(/^knowledge\/(.+)$/)?.[1]
        const chapter = slug ? chapterBySlug.get(slug) : undefined
        return (
          <span key={ref}>
            {i > 0 && '、'}
            {chapter ? (
              <Link
                href={`/rules/${chapter.slug}`}
                className="font-bold text-orange-600 underline underline-offset-2"
              >
                📖 {chapter.title}
              </Link>
            ) : (
              ref
            )}
          </span>
        )
      })}
    </p>
  )
}
