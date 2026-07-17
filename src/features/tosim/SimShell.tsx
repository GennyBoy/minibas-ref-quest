import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import type { GameScript } from '../../../content/sim/types'
import { useSettings } from '../../stores/settings'
import { firedEvents } from './engine'
import SimResult from './SimResult'
import type { SimRolePlugin } from './roles/registry'
import { SIM_RATES, useSimEngine } from './useSimEngine'

/**
 * シミュレーター再生画面の共通枠: 実況フィード・役割パネル・再生コントロール・結果。
 * 役割ごとの操作UIは plugin.Panel に委譲する。
 */
export default function SimShell({
  script,
  plugin,
  onRetry,
}: {
  script: GameScript
  plugin: SimRolePlugin
  onRetry: () => void
}) {
  const sim = useSimEngine(script, plugin.role)
  const ruleset = useSettings((s) => s.ruleset)
  const backHref = `/to/${plugin.role}`

  if (sim.state.status === 'finished') {
    return <SimResult state={sim.state} plugin={plugin} onRetry={onRetry} />
  }

  const fired = firedEvents(sim.state)
  const latest = fired[0]
  const started = sim.playing || fired.length > 0

  // 開始前の説明カード
  if (!started) {
    return (
      <div className="space-y-4">
        <Link href={backHref} className="inline-block text-sm text-slate-500">
          ← {ROLE_LABELS[plugin.role]}ハブ
        </Link>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-4xl">{plugin.icon}</div>
          <h1 className="mt-2 text-lg font-black">{script.title}</h1>
          <p className="mt-1 text-xs font-bold text-orange-600">{ROLE_LABELS[plugin.role]}編</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{script.description}</p>
          {ruleset === 'general' && script.ruleset === 'u12' && (
            <p className="mt-3 rounded-xl bg-sky-50 p-2 text-xs font-bold text-sky-700">
              🏀 この台本はU12ルールで進行します
            </p>
          )}
          <ul className="mt-4 space-y-1 text-left text-xs leading-relaxed text-slate-500">
            <li>・実況に合わせて、自分の役割の仕事だけを操作する</li>
            <li>・操作が不要な場面もある（押しすぎは減点）</li>
            <li>・⏸ 一時停止と再生速度の変更、⏭ イベント送りができる</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={sim.play}
          className="block w-full rounded-2xl bg-orange-500 p-4 text-center text-lg font-black text-white shadow active:scale-[0.99]"
        >
          ▶ シミュレーション開始
        </button>
      </div>
    )
  }

  const lastResult = sim.state.results[sim.state.results.length - 1]
  const lastFalse = sim.state.falseInputs[sim.state.falseInputs.length - 1]
  const showFalse = lastFalse !== undefined && (!lastResult || lastFalse.simMs > sim.state.simMs - 4000)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link href={backHref}>← やめる</Link>
        <span>
          {ROLE_LABELS[plugin.role]}編 イベント {fired.length} / {script.events.length}
        </span>
      </div>

      {/* 実況フィード */}
      <div key={latest?.id} className="rounded-2xl bg-white p-4 shadow-sm animate-quiz-pop">
        <p className="text-[11px] font-bold text-slate-400">📣 実況</p>
        <p className="mt-1 font-medium leading-relaxed">{latest?.narration ?? '……'}</p>
      </div>
      {fired[1] && (
        <p className="-mt-2 truncate px-2 text-[11px] text-slate-400">前: {fired[1].narration}</p>
      )}

      <plugin.Panel
        state={sim.state}
        gameText={sim.gameText}
        shotText={sim.shotText}
        onInput={sim.submitInput}
        disabled={!sim.playing}
      />

      {/* 直近の照合結果 */}
      {lastResult && !showFalse && (
        <p
          key={sim.state.results.length}
          className={`text-center text-sm font-black animate-quiz-pop ${
            lastResult.outcome === 'correct'
              ? 'text-emerald-600'
              : lastResult.outcome === 'wrong'
                ? 'text-rose-600'
                : 'text-amber-600'
          }`}
        >
          {lastResult.outcome === 'correct' && `⭕ ${plugin.describeExpect(lastResult.expect)}`}
          {lastResult.outcome === 'wrong' && `❌ 正しくは: ${plugin.describeExpect(lastResult.expect)}`}
          {lastResult.outcome === 'missed' && `⏰ 見逃し！ ${plugin.describeExpect(lastResult.expect)}`}
        </p>
      )}
      {showFalse && (
        <p key={`f-${sim.state.falseInputs.length}`} className="text-center text-sm font-black text-rose-600 animate-quiz-pop">
          🚫 いまは操作の場面ではない（−30点）
        </p>
      )}

      {sim.pausedByHidden && (
        <button
          type="button"
          onClick={sim.play}
          className="block w-full rounded-2xl bg-slate-800 p-4 text-center font-bold text-white active:scale-[0.99]"
        >
          ⏸ 一時停止中 — タップで再開
        </button>
      )}

      {/* 再生コントロール */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={sim.playing ? sim.pause : sim.play}
          className="rounded-xl bg-slate-800 px-4 py-2.5 font-black text-white active:scale-[0.97]"
        >
          {sim.playing ? '⏸' : '▶'}
        </button>
        <div className="flex flex-1 justify-center gap-1.5">
          {SIM_RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => sim.setRate(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                sim.rate === r ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 shadow-sm'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={sim.stepEvent}
          title="次のイベントへ送る（待ち中の操作は見逃しになる）"
          className="rounded-xl bg-white px-4 py-2.5 font-black text-slate-600 shadow-sm active:scale-[0.97]"
        >
          ⏭
        </button>
      </div>
      {!sim.playing && !sim.pausedByHidden && (
        <p className="text-center text-[11px] text-slate-400">一時停止中（操作パネルは無効）</p>
      )}
    </div>
  )
}
