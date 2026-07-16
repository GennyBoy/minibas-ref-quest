import { useEffect, useState } from 'react'
import {
  gameClockCases,
  GAME_CLOCK_ACTION_LABELS,
  type GameClockAction,
  type GameClockCase,
} from '../../content/drills'
import { useSettings } from '../stores/settings'
import { shuffle } from '../lib/session'
import { type DrillMode } from '../lib/drill'
import { formatGameClock } from '../lib/clock'
import { useClock } from '../features/drills/useClock'
import { DRILLS } from '../features/drills/registry'
import DrillShell from '../features/drills/DrillShell'
import ModePicker from '../features/drills/ModePicker'
import RefsLine from '../features/drills/RefsLine'
import ClockDisplay from '../components/ClockDisplay'

const META = DRILLS.find((d) => d.id === 'gameclock')!

const QUESTIONS_PER_SESSION = 10

const ACTION_BUTTONS: {
  action: GameClockAction
  main: string
  sub: string
  cls: string
}[] = [
  { action: 'start', main: '▶', sub: 'スタート', cls: 'bg-emerald-500' },
  { action: 'stop', main: '⏹', sub: 'ストップ', cls: 'bg-rose-500' },
  { action: 'none', main: '✋', sub: '何もしない', cls: 'bg-slate-600' },
]

export default function DrillGameClock() {
  const defaultRuleset = useSettings((s) => s.ruleset)
  const [mode, setMode] = useState<DrillMode | null>(null)
  const [nonce, setNonce] = useState(0)

  if (mode === null) {
    return (
      <ModePicker
        meta={META}
        lead={`場面を見て「スタート / ストップ / 何もしない」を${META.timeLimitMs / 1000}秒以内に判断。全${QUESTIONS_PER_SESSION}問`}
        modes={[
          {
            mode: 'u12',
            title: '🏀 U12（ミニバス）',
            description: 'ミニバスのルールで判断する（L2Mのクロック停止なし）',
            highlight: defaultRuleset === 'u12',
          },
          {
            mode: 'general',
            title: '🏀 一般（5人制）',
            description: '一般ルールで判断する（第4Q・OT残り2:00以下のFG成功で停止）',
            highlight: defaultRuleset === 'general',
          },
        ]}
        onPick={setMode}
      />
    )
  }
  return (
    <GameClockSession
      key={`${mode}-${nonce}`}
      mode={mode}
      onRetry={() => setNonce((n) => n + 1)}
      onChangeMode={() => setMode(null)}
    />
  )
}

function GameClockSession({
  mode,
  onRetry,
  onChangeMode,
}: {
  mode: DrillMode
  onRetry: () => void
  onChangeMode: () => void
}) {
  const ruleset = mode === 'general' ? 'general' : 'u12'
  const [steps] = useState<GameClockCase[]>(() =>
    shuffle(gameClockCases).slice(0, QUESTIONS_PER_SESSION),
  )
  const [picks, setPicks] = useState<(GameClockAction | null)[]>([])

  return (
    <DrillShell
      meta={META}
      mode={mode}
      steps={steps.length}
      timeLimitMs={META.timeLimitMs}
      onRetry={onRetry}
      onChangeMode={onChangeMode}
      renderQuestion={(idx, submit) => {
        const c = steps[idx]
        const expected = c.answer[ruleset]
        return (
          <div className="space-y-3">
            <AmbientGameClock key={idx} clock={c.clock} />
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <span
                className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  ruleset === 'u12' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {ruleset === 'u12' ? 'U12' : '一般'}
              </span>
              <p className="font-medium leading-relaxed">{c.situation}</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
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
        const c = steps[idx]
        const expected = c.answer[ruleset]
        const picked = picks[idx] ?? null
        const divergent = c.answer.u12 !== c.answer.general
        return (
          <div className="space-y-2 text-sm">
            <p className="font-bold text-slate-700">
              正解: {GAME_CLOCK_ACTION_LABELS[expected]}
              {!log.correct && picked && (
                <span className="ml-2 font-medium text-rose-500">
                  （あなた: {GAME_CLOCK_ACTION_LABELS[picked]}）
                </span>
              )}
            </p>
            {divergent && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border-2 border-sky-300 bg-sky-50 p-2 text-center">
                  <p className="text-[11px] font-bold text-sky-700">U12</p>
                  <p className="mt-0.5 font-black text-sky-800">
                    {GAME_CLOCK_ACTION_LABELS[c.answer.u12]}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-2 text-center">
                  <p className="text-[11px] font-bold text-slate-600">一般</p>
                  <p className="mt-0.5 font-black text-slate-800">
                    {GAME_CLOCK_ACTION_LABELS[c.answer.general]}
                  </p>
                </div>
              </div>
            )}
            <p className="leading-relaxed text-slate-700">{c.explanation}</p>
            <RefsLine refs={c.refs} />
          </div>
        )
      }}
    />
  )
}

/** ケースの指定どおりに動く／止まっているゲームクロックの演出 */
function AmbientGameClock({ clock }: { clock: GameClockCase['clock'] }) {
  const c = useClock(clock.gameMs, formatGameClock)
  const { start } = c
  const running = clock.running
  useEffect(() => {
    if (running) start()
  }, [running, start])
  return (
    <div>
      {clock.quarter && (
        <p className="mb-1 text-center text-xs font-bold text-slate-500">{clock.quarter}</p>
      )}
      <ClockDisplay gameText={c.text} />
    </div>
  )
}
