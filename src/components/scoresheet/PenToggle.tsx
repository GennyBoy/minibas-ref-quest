import type { PenColor } from '../../../content/drills/types'

/** 赤／濃色ペンの切り替え。ペン選びも採点対象なので常に見える場所に置く */
export default function PenToggle({
  color,
  onChange,
}: {
  color: PenColor
  onChange: (c: PenColor) => void
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-slate-500">ペンの色</p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange('red')}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl font-black shadow-sm active:scale-[0.97] ${
            color === 'red' ? 'bg-red-600 text-white' : 'bg-white text-red-600'
          }`}
        >
          <span className="h-3 w-3 rounded-full bg-current" aria-hidden="true" />
          赤ペン
        </button>
        <button
          type="button"
          onClick={() => onChange('dark')}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl font-black shadow-sm active:scale-[0.97] ${
            color === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
          }`}
        >
          <span className="h-3 w-3 rounded-full bg-current" aria-hidden="true" />
          濃色ペン
        </button>
      </div>
    </div>
  )
}
