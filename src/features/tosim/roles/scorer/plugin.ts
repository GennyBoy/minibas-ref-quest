import type { SimRolePlugin } from '../registry'
import ScorerPanel from './Panel'
import { describeScorerExpect, describeScorerInput } from './logic'

export const scorerPlugin: SimRolePlugin = {
  role: 'scorer',
  icon: '📝',
  shortTitle: '記入シミュレーター',
  description: '1Qを通しでシート記入。得点・ファウル・TO・APアローをリアルタイム記録',
  Panel: ScorerPanel,
  describeExpect: (expect) =>
    'action' in expect ? '(不明な期待)' : describeScorerExpect(expect),
  describeInput: describeScorerInput,
}
