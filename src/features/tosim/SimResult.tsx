import { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import { SIM_EVENT_TYPE_LABELS } from '../../../content/sim/types'
import { formatGameClock } from '../../lib/clock'
import { isNewSimBest, simBestKey, simXp, tallySim } from '../../lib/sim'
import { useProgress } from '../../stores/progress'
import RefsLine from '../drills/RefsLine'
import type { SimEngineState, SimEventResult, SimFalseInput } from './engine'
import type { SimRolePlugin } from './roles/registry'

type Filter = 'all' | 'missed' | 'wrong'

type Row =
  | { kind: 'result'; at: number; r: SimEventResult }
  | { kind: 'false'; at: number; f: SimFalseInput }

const OUTCOME_BADGES: Record<SimEventResult['outcome'], { label: string; cls: string }> = {
  correct: { label: '⭕ 正解', cls: 'text-emerald-600' },
  wrong: { label: '❌ ミス', cls: 'text-rose-600' },
  missed: { label: '⏰ 見逃し', cls: 'text-amber-600' },
}

export default function SimResult({
  state,
  plugin,
  onRetry,
}: {
  state: SimEngineState
  plugin: SimRolePlugin
  onRetry: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [final] = useState(() => {
    const summary = tallySim(state.results, state.falseInputs.length)
    const key = simBestKey(state.script.id, plugin.role)
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
      .recordSim(final.key, state.script.id, plugin.role, final.summary, final.xp, Date.now())
  }, [final, state.script.id, plugin.role])

  const rows: Row[] = [
    ...state.results.map((r): Row => ({ kind: 'result', at: r.event.atMs, r })),
    ...state.falseInputs.map((f): Row => ({ kind: 'false', at: f.simMs, f })),
  ].sort((a, b) => a.at - b.at)

  const visible = rows.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'missed') return row.kind === 'result' && row.r.outcome === 'missed'
    return row.kind === 'false' || (row.kind === 'result' && row.r.outcome === 'wrong')
  })

  const s = final.summary
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          {plugin.icon} {state.script.title}（{ROLE_LABELS[plugin.role]}） 結果
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
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
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
            <p className="font-black text-slate-700">{s.missed}</p>
            <p className="text-[10px] text-slate-500">見逃し</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="font-black text-slate-700">{s.falseInputs}</p>
            <p className="text-[10px] text-slate-500">誤操作</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          平均反応 {s.avgDelayMs !== null ? `${(s.avgDelayMs / 1000).toFixed(1)}秒` : '—'}
        </p>
        <p className="mt-3 font-bold text-emerald-600">+{final.xp} XP</p>
      </div>

      <div className="flex gap-2 text-sm">
        {(
          [
            ['all', 'すべて'],
            ['missed', '⏰ 見逃し'],
            ['wrong', '❌ ミス・誤操作'],
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
          <p className="py-6 text-center text-sm text-slate-400">
            {filter === 'all' ? '照合対象のイベントがありませんでした' : '該当なし 🎉'}
          </p>
        )}
        {visible.map((row) =>
          row.kind === 'result' ? (
            <ResultRow key={`r-${row.r.event.id}`} r={row.r} plugin={plugin} />
          ) : (
            <FalseInputRow key={`f-${row.at}`} f={row.f} state={state} plugin={plugin} />
          ),
        )}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="block w-full rounded-2xl bg-orange-500 p-4 text-center font-black text-white shadow active:scale-[0.99]"
      >
        もう一度挑戦する
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

function ResultRow({ r, plugin }: { r: SimEventResult; plugin: SimRolePlugin }) {
  const badge = OUTCOME_BADGES[r.outcome]
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>
          残り {formatGameClock(r.event.gameClockMs)}・{SIM_EVENT_TYPE_LABELS[r.event.type]}
        </span>
        <span className={`font-bold ${badge.cls}`}>
          {badge.label}
          {r.delayMs !== null && (
            <span className="ml-1 font-medium text-slate-400">
              反応 {(r.delayMs / 1000).toFixed(1)}秒
            </span>
          )}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium leading-relaxed">{r.event.narration}</p>
      <p className="mt-1 text-xs text-slate-600">
        期待: <b>{plugin.describeExpect(r.expect)}</b>
        {r.input && (
          <span className={r.outcome === 'correct' ? '' : 'text-rose-600'}>
            {' '}
            ／ あなた: {plugin.describeInput(r.input)}
          </span>
        )}
      </p>
      {r.entryGrade && !r.entryGrade.all && (
        <div className="mt-1 flex flex-wrap gap-x-3 text-[11px]">
          {(
            [
              ['枠', r.entryGrade.cell],
              ['記号', r.entryGrade.symbol],
              ['添え数字', r.entryGrade.detail],
              ['ペンの色', r.entryGrade.color],
            ] as [string, boolean][]
          ).map(([label, ok]) => (
            <span key={label} className={ok ? 'text-emerald-600' : 'font-bold text-rose-600'}>
              {ok ? '✓' : '✗'} {label}
            </span>
          ))}
        </div>
      )}
      {r.outcome !== 'correct' && (
        <div className="mt-1.5">
          <RefsLine refs={r.event.refs} />
        </div>
      )}
    </div>
  )
}

function FalseInputRow({
  f,
  state,
  plugin,
}: {
  f: SimFalseInput
  state: SimEngineState
  plugin: SimRolePlugin
}) {
  const near = f.nearEventId
    ? state.script.events.find((e) => e.id === f.nearEventId)
    : undefined
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{near ? `「${near.narration}」の後` : '開始直後'}</span>
        <span className="font-bold text-rose-600">🚫 誤操作（−30点）</span>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        操作の必要がない場面で <b className="text-rose-600">{plugin.describeInput(f.input)}</b>
      </p>
    </div>
  )
}
