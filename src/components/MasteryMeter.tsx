export default function MasteryMeter({
  value,
  label,
  threshold,
}: {
  value: number
  label?: string
  threshold?: number
}) {
  const pct = Math.round(value * 100)
  const reached = threshold !== undefined && value >= threshold
  return (
    <div>
      {label && (
        <div className="mb-0.5 flex justify-between text-xs text-slate-600">
          <span>{label}</span>
          <span className={reached ? 'font-bold text-emerald-600' : ''}>{pct}%</span>
        </div>
      )}
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${reached ? 'bg-emerald-500' : 'bg-orange-400'}`}
          style={{ width: `${pct}%` }}
        />
        {threshold !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-400"
            style={{ left: `${threshold * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}
