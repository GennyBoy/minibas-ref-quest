import { TO_ROLES, ROLE_LABELS, DOMAINS, DOMAIN_LABELS } from '../../content'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'
import { questionPool } from '../features/quiz/pool'
import { roleMastery, BADGE_THRESHOLD } from '../lib/badges'
import { mastery } from '../lib/mastery'
import XpBar from '../components/XpBar'
import MasteryMeter from '../components/MasteryMeter'

export default function Progress() {
  const { xp, srs, sessions } = useProgress()
  const ruleset = useSettings((s) => s.ruleset)
  const now = Date.now()
  const pool = questionPool(ruleset)

  const totalAnswers = Object.values(srs).reduce((sum, s) => sum + s.history.length, 0)
  const totalCorrect = Object.values(srs).reduce(
    (sum, s) => sum + s.history.filter((h) => h.correct).length,
    0,
  )
  const recent = [...sessions].reverse().slice(0, 10)

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-center text-lg font-black text-orange-700">📈 学習の進捗</h1>

      <XpBar xp={xp} />

      <div className="grid grid-cols-3 gap-2.5 text-center">
        <Stat label="セッション" value={String(sessions.length)} />
        <Stat label="解答数" value={String(totalAnswers)} />
        <Stat
          label="正答率"
          value={totalAnswers > 0 ? `${Math.round((totalCorrect / totalAnswers) * 100)}%` : '—'}
        />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-600">役割別の習熟度</h2>
        <div className="space-y-3">
          {TO_ROLES.map((role) => (
            <MasteryMeter
              key={role}
              value={roleMastery(pool, role, srs, now)}
              label={ROLE_LABELS[role]}
              threshold={BADGE_THRESHOLD}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-600">分野別の習熟度</h2>
        <div className="space-y-3">
          {DOMAINS.map((domain) => {
            const ids = pool.filter((q) => q.domain === domain).map((q) => q.id)
            if (ids.length === 0) return null
            return (
              <MasteryMeter
                key={domain}
                value={mastery(ids, srs, now)}
                label={`${DOMAIN_LABELS[domain]}（${ids.length}問）`}
              />
            )
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-slate-600">最近のセッション</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {recent.map((s, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500">
                  {new Date(s.at).toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric',
                  })}{' '}
                  {s.role ? ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] : '復習'}
                </span>
                <span>
                  {s.correct}/{s.total} 問{' '}
                  <span className="text-xs font-bold text-emerald-600">+{s.xpGained}XP</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-lg font-black text-orange-600">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
