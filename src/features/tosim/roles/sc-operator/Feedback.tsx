import { SIM_SC_ACTION_LABELS } from '../../../../../content/sim/types'
import RefsLine from '../../../drills/RefsLine'
import type { SimFeedbackProps } from '../registry'

export default function ScOperatorFeedback({ step, input, grade }: SimFeedbackProps) {
  const expect = step.expect
  if (!('action' in expect)) return null
  return (
    <div className="space-y-2 text-sm">
      <p className="font-bold text-slate-700">
        正解: {SIM_SC_ACTION_LABELS[expect.action]}
        {!grade.correct && input.kind === 'sc' && (
          <span className="ml-2 font-medium text-rose-500">
            （あなた: {SIM_SC_ACTION_LABELS[input.action]}）
          </span>
        )}
      </p>
      <p className="leading-relaxed text-slate-700">{step.explanation}</p>
      <RefsLine refs={step.event.refs} />
    </div>
  )
}
