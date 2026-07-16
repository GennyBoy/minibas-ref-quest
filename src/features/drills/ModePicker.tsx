import { Link } from 'wouter'
import { ROLE_LABELS } from '../../../content'
import { useProgress } from '../../stores/progress'
import { drillBestKey, type DrillMode } from '../../lib/drill'
import type { DrillMeta } from './registry'

export interface ModeOption {
  mode: DrillMode
  title: string
  description: string
  highlight: boolean
}

/** ドリル開始前のモード選択画面（自己ベスト表示つき） */
export default function ModePicker({
  meta,
  lead,
  modes,
  onPick,
}: {
  meta: DrillMeta
  /** ヘッダーに出すドリルの説明文 */
  lead: string
  modes: ModeOption[]
  onPick: (m: DrillMode) => void
}) {
  const drillBest = useProgress((s) => s.drillBest)
  return (
    <div className="space-y-4">
      <Link href={`/to/${meta.role}`} className="inline-block text-sm text-slate-500">
        ← {ROLE_LABELS[meta.role]}ハブ
      </Link>
      <header className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <div className="text-4xl">{meta.icon}</div>
        <h1 className="mt-1 text-lg font-black">{meta.title}</h1>
        <p className="mt-1 text-xs text-slate-500">{lead}</p>
      </header>
      <div className="space-y-2.5">
        {modes.map(({ mode, title, description, highlight }) => {
          const best = drillBest[drillBestKey(meta.id, mode)]
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
