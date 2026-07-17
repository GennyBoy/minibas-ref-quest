import type { PlacedMark, Team } from '../../../content/drills/types'
import type { ScExpect, ScorerExpect, SimScAction } from '../../../content/sim/types'

/** 役割パネルからエンジンに送る操作 */
export type SimInput =
  | { kind: 'sc'; action: SimScAction }
  | { kind: 'mark'; mark: PlacedMark }
  | { kind: 'apArrow'; to: Team }

export type SimInputKind = SimInput['kind']

/** いずれかの役割の期待アクション（役割追加時はここに union を足す） */
export type RoleExpect = ScExpect | ScorerExpect

/** 期待アクションが受け付ける操作の種類 */
export function kindOf(expect: RoleExpect): SimInputKind {
  return 'action' in expect ? 'sc' : expect.kind
}
