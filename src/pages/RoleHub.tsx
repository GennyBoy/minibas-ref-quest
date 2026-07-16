import { Link, useParams } from 'wouter'
import { TO_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type ToRole } from '../../content'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'
import { questionPool, ROLE_ICONS } from '../features/quiz/pool'
import { dueCount } from '../lib/session'
import { roleMastery, hasBadge, questionIdsForRole, BADGE_THRESHOLD } from '../lib/badges'
import { drillBestKey, type DrillMode } from '../lib/drill'
import { drillsForRole } from '../features/drills/registry'
import MasteryMeter from '../components/MasteryMeter'

const DRILL_MODES: DrillMode[] = ['u12', 'general', 'compare']

export default function RoleHub() {
  const params = useParams<{ role: string }>()
  const role = TO_ROLES.find((r) => r === params.role) as ToRole | undefined
  const { srs, drillBest } = useProgress()
  const ruleset = useSettings((s) => s.ruleset)

  if (!role) {
    return <p className="py-20 text-center text-slate-500">この役割は存在しません</p>
  }

  const now = Date.now()
  const pool = questionPool(ruleset)
  const ids = questionIdsForRole(pool, role)
  const seen = ids.filter((id) => srs[id]).length
  const m = roleMastery(pool, role, srs, now)
  const badge = hasBadge(pool, role, srs, now)
  const due = dueCount(pool, srs, role, now)
  const drills = drillsForRole(role)

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-block text-sm text-slate-500">
        ← ホーム
      </Link>

      <header className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="text-4xl">{ROLE_ICONS[role]}</div>
        <h1 className="mt-1 flex items-center justify-center gap-1.5 text-lg font-black">
          {ROLE_LABELS[role]}
          {badge && <span title="バッジ獲得済み">🏅</span>}
        </h1>
        <p className="mt-1 text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
        <div className="mt-4">
          <MasteryMeter
            value={m}
            label={`習熟度（バッジは${Math.round(BADGE_THRESHOLD * 100)}%で獲得）`}
            threshold={BADGE_THRESHOLD}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          問題 {ids.length} 問中 {seen} 問に挑戦済み
          {due > 0 && <span className="font-bold text-amber-600">・復習 {due} 問</span>}
        </p>
      </header>

      <Link
        href={`/to/${role}/quiz`}
        className="block rounded-2xl bg-orange-500 p-4 text-center text-lg font-black text-white shadow active:scale-[0.99]"
      >
        ▶ クイズを始める
      </Link>

      <div className="grid grid-cols-2 gap-2.5">
        {drills.length > 0 ? (
          drills.map((d) => {
            const best = Math.max(
              0,
              ...DRILL_MODES.map((m) => drillBest[drillBestKey(d.id, m)]?.score ?? 0),
            )
            return (
              <Link
                key={d.id}
                href={d.route}
                className="rounded-2xl bg-white p-4 text-center shadow-sm active:scale-[0.99]"
              >
                <p className="text-sm font-black text-orange-600">
                  {d.icon} {d.shortTitle}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {best > 0 ? `🏆 ベスト ${best}点` : d.description}
                </p>
              </Link>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center">
            <p className="text-sm font-bold text-slate-400">🎮 ドリル</p>
            <p className="mt-1 text-[11px] text-slate-400">近日公開</p>
          </div>
        )}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center">
          <p className="text-sm font-bold text-slate-400">🎬 シミュレーター</p>
          <p className="mt-1 text-[11px] text-slate-400">近日公開</p>
        </div>
      </div>
    </div>
  )
}
