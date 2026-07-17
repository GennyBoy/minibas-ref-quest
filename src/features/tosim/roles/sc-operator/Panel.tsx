import { useState } from 'react'
import ClockDisplay from '../../../../components/ClockDisplay'
import type { SimScAction } from '../../../../../content/sim/types'
import type { SimPanelProps } from '../registry'

const BUTTONS: { action: SimScAction; main: string; sub: string; cls: string }[] = [
  { action: 'reset24', main: '24', sub: 'リセット', cls: 'bg-sky-500' },
  { action: 'reset14', main: '14', sub: 'リセット', cls: 'bg-violet-500' },
  { action: 'keep', main: '⏵', sub: '継続', cls: 'bg-emerald-500' },
]

/** 連打の誤爆（falseInput減点）を防ぐ押下後のロック時間 */
const LOCK_MS = 500

export default function ScOperatorPanel({ gameText, shotText, onInput, disabled }: SimPanelProps) {
  const [locked, setLocked] = useState(false)

  function press(action: SimScAction) {
    if (locked || disabled) return
    setLocked(true)
    window.setTimeout(() => setLocked(false), LOCK_MS)
    onInput({ kind: 'sc', action })
  }

  return (
    <div className="space-y-3">
      <ClockDisplay gameText={gameText} shotText={shotText} />
      <div className="grid grid-cols-3 gap-2.5">
        {BUTTONS.map(({ action, main, sub, cls }) => (
          <button
            key={action}
            type="button"
            onClick={() => press(action)}
            disabled={disabled}
            className={`min-h-20 rounded-2xl p-3 text-center text-white shadow-sm transition active:scale-[0.97] disabled:opacity-40 ${cls}`}
          >
            <span className="block text-3xl font-black leading-none">{main}</span>
            <span className="mt-1 block text-xs font-bold">{sub}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
