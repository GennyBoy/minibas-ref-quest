import { SIM_SC_ACTIONS, SIM_SC_ACTION_LABELS } from '../../../../../content/sim/types'
import type { SimRolePlugin } from '../registry'
import ScOperatorFeedback from './Feedback'
import ScOperatorPanel from './Panel'

export const scOperatorPlugin: SimRolePlugin = {
  role: 'sc-operator',
  icon: '⏱️',
  shortTitle: 'SCシミュレーター',
  description: '試合の場面ごとに 24 / 14 / 継続 を判断して答え合わせ',
  Panel: ScOperatorPanel,
  Feedback: ScOperatorFeedback,
  describeExpect: (expect) =>
    'action' in expect ? SIM_SC_ACTION_LABELS[expect.action] : '(不明な期待)',
  describeInput: (input) =>
    input.kind === 'sc' && SIM_SC_ACTIONS.includes(input.action)
      ? SIM_SC_ACTION_LABELS[input.action]
      : '(不明な操作)',
}
