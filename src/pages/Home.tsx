import { Link } from 'wouter'
import { TO_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../content'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'
import { questionPool, ROLE_ICONS } from '../features/quiz/pool'
import { dueCount } from '../lib/session'
import { roleMastery, hasBadge, isToMaster, BADGE_THRESHOLD } from '../lib/badges'
import XpBar from '../components/XpBar'
import MasteryMeter from '../components/MasteryMeter'

export default function Home() {
  const { xp, srs } = useProgress()
  const ruleset = useSettings((s) => s.ruleset)
  const now = Date.now()
  const pool = questionPool(ruleset)
  const due = dueCount(pool, srs, null, now)
  const master = isToMaster(pool, srs, now)

  return (
    <div className="space-y-4">
      <header className="pt-2 text-center">
        <h1 className="text-xl font-black tracking-tight text-orange-700">
          🏀 ミニバスTO・審判クエスト
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          役割を選んでクイズに挑戦、バッジを集めてTOマスターへ
        </p>
      </header>

      <XpBar xp={xp} />

      {due > 0 && (
        <Link
          href="/quiz"
          className="block rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center shadow-sm active:scale-[0.99]"
        >
          <span className="font-bold text-amber-700">📚 復習が {due} 問たまっています</span>
          <span className="mt-0.5 block text-xs text-amber-600">タップして復習クイズを始める</span>
        </Link>
      )}

      {master && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-center font-black text-white shadow">
          👑 TOマスター達成！全役割のバッジを獲得しました
        </div>
      )}

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-slate-600">TOの役割を選ぶ</h2>
        <div className="space-y-2.5">
          {TO_ROLES.map((role) => {
            const m = roleMastery(pool, role, srs, now)
            const badge = hasBadge(pool, role, srs, now)
            return (
              <Link
                key={role}
                href={`/to/${role}`}
                className="block rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ROLE_ICONS[role]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{ROLE_LABELS[role]}</span>
                      {badge && <span title="バッジ獲得済み">🏅</span>}
                    </div>
                    <p className="truncate text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{Math.round(m * 100)}%</span>
                </div>
                <div className="mt-2">
                  <MasteryMeter value={m} threshold={BADGE_THRESHOLD} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-center">
        <p className="text-sm font-bold text-slate-400">🧑‍⚖️ 審判モード（昇格クエスト）</p>
        <p className="mt-1 text-xs text-slate-400">近日公開 — まずはTOバッジを集めよう</p>
      </section>
    </div>
  )
}
