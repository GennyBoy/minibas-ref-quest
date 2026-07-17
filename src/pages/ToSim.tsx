import { useMemo, useState } from 'react'
import { Link, useParams } from 'wouter'
import { ROLE_LABELS, TO_ROLES, type ToRole } from '../../content'
import { gameU12Script } from '../../content/sim'
import type { DrillBest } from '../lib/drill'
import { simBestKey } from '../lib/sim'
import SimShell from '../features/tosim/SimShell'
import { simPluginForRole } from '../features/tosim/roles/registry'
import { SIM_SEGMENTS, buildSession, segmentLabel, type SimSegment } from '../features/tosim/steps'
import { useProgress } from '../stores/progress'

function segmentDescription(segment: SimSegment, count: number): string {
  if (segment === 'full') return `ジャンプボールからゲーム終了まで、全部の場面を判断する（${count}問）`
  if (segment === 'closing') {
    return `第1Q締め→前半→第3Q→ゲーム終了。締めの記帳だけを続けて練習（${count}問）`
  }
  return `このクォーターの場面だけ（${count}問）。それまでの記入・アローは復元済みで始まる`
}

function segmentIcon(segment: SimSegment): string {
  if (segment === 'full') return '🏀'
  if (segment === 'closing') return '✍️'
  return '▶'
}

export default function ToSim() {
  const params = useParams<{ role: string }>()
  const role = TO_ROLES.find((r) => r === params.role) as ToRole | undefined
  const [segment, setSegment] = useState<SimSegment | null>(null)
  const [nonce, setNonce] = useState(0)
  const drillBest = useProgress((s) => s.drillBest)

  if (!role) {
    return <p className="py-20 text-center text-slate-500">この役割は存在しません</p>
  }
  const plugin = simPluginForRole(role)
  if (!plugin) {
    return (
      <div className="space-y-4">
        <Link href={`/to/${role}`} className="inline-block text-sm text-slate-500">
          ← {ROLE_LABELS[role]}ハブ
        </Link>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <p className="font-bold text-slate-400">🎬 {ROLE_LABELS[role]}のシミュレーター</p>
          <p className="mt-1 text-xs text-slate-400">近日公開</p>
        </div>
      </div>
    )
  }

  const script = gameU12Script

  if (segment === null) {
    return (
      <SegmentPicker
        role={role}
        onPick={setSegment}
        drillBest={drillBest}
      />
    )
  }

  return (
    <SimShell
      key={`${segment}-${nonce}`}
      script={script}
      plugin={plugin}
      segment={segment}
      onRetry={() => setNonce((n) => n + 1)}
      onChangeSegment={() => setSegment(null)}
    />
  )
}

function SegmentPicker({
  role,
  onPick,
  drillBest,
}: {
  role: ToRole
  onPick: (segment: SimSegment) => void
  drillBest: Record<string, DrillBest>
}) {
  const plugin = simPluginForRole(role)!
  const script = gameU12Script
  // その役割に出番のないセグメント（例: SCオペレーターの「締めの記帳だけ」）は出さない
  const segments = useMemo(
    () =>
      SIM_SEGMENTS.map((seg) => ({
        seg,
        count: buildSession(script, role, seg).steps.length,
      })).filter((s) => s.count > 0),
    [script, role],
  )
  return (
    <div className="space-y-4">
      <Link href={`/to/${role}`} className="inline-block text-sm text-slate-500">
        ← {ROLE_LABELS[role]}ハブ
      </Link>
      <header className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="text-4xl">{plugin.icon}</div>
        <h1 className="mt-1 text-lg font-black">{plugin.shortTitle}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {script.title}・{plugin.description}
        </p>
      </header>
      <div className="space-y-2.5">
        {segments.map(({ seg, count }) => {
          const best = drillBest[simBestKey(script.id, role, seg)]
          return (
            <button
              key={String(seg)}
              type="button"
              onClick={() => onPick(seg)}
              className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <p className="font-black text-slate-800">
                {segmentIcon(seg)} {segmentLabel(seg)}
                {best && (
                  <span className="ml-2 text-xs font-bold text-amber-600">
                    🏆 ベスト {best.score}点
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{segmentDescription(seg, count)}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
