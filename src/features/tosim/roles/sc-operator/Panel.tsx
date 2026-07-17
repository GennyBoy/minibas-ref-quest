import ClockDisplay from '../../../../components/ClockDisplay'
import type { SimScAction } from '../../../../../content/sim/types'
import { formatGameClock, formatShotClock } from '../../../../lib/clock'
import type { SimPanelProps } from '../registry'

const BUTTONS: { action: SimScAction; main: string; sub: string; cls: string }[] = [
  { action: 'reset24', main: '24', sub: 'リセット', cls: 'bg-sky-500' },
  { action: 'reset14', main: '14', sub: 'リセット', cls: 'bg-violet-500' },
  { action: 'keep', main: '⏵', sub: '継続（そのまま）', cls: 'bg-emerald-500' },
]

export default function ScOperatorPanel({ step, onSubmit }: SimPanelProps) {
  const shotText = step.shotBeforeMs === null ? null : formatShotClock(step.shotBeforeMs)
  return (
    <div className="space-y-3">
      <ClockDisplay gameText={formatGameClock(step.event.gameClockMs)} shotText={shotText} />
      <p className="text-center text-xs font-bold text-slate-500">
        {step.shotBeforeMs === null
          ? 'ショットクロックは非表示中。この場面、どうする？'
          : 'この場面、ショットクロックをどうする？'}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {BUTTONS.map(({ action, main, sub, cls }) => (
          <button
            key={action}
            type="button"
            onClick={() => onSubmit({ kind: 'sc', action })}
            className={`min-h-20 rounded-2xl p-3 text-center text-white shadow-sm transition active:scale-[0.97] ${cls}`}
          >
            <span className="block text-3xl font-black leading-none">{main}</span>
            <span className="mt-1 block text-xs font-bold">{sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
