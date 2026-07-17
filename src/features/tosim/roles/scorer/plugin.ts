import type { SimRolePlugin } from '../registry'
import ScorerFeedback from './Feedback'
import ScorerPanel from './Panel'
import { describeScorerExpect, describeScorerInput } from './logic'

export const scorerPlugin: SimRolePlugin = {
  role: 'scorer',
  icon: '📝',
  shortTitle: '記入シミュレーター',
  description: '試合のイベントを1つずつシートに記入して答え合わせ',
  Panel: ScorerPanel,
  Feedback: ScorerFeedback,
  describeExpect: (expect) => ('action' in expect ? '(不明な期待)' : describeScorerExpect(expect)),
  describeInput: describeScorerInput,
}
