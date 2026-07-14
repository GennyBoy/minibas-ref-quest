import { levelForXp } from '../lib/xp'

export default function XpBar({ xp }: { xp: number }) {
  const { level, current, next } = levelForXp(xp)
  const pct = Math.min(100, Math.round((current / next) * 100))
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-bold text-orange-600">Lv.{level}</span>
        <span className="text-xs text-slate-500">
          {current} / {next} XP（累計 {xp}）
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
