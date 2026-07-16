import type { ToRole } from '../../../content'
import type { DrillId } from '../../../content/drills'

export interface DrillMeta {
  id: DrillId
  route: string
  role: ToRole
  icon: string
  title: string
  /** 役割ハブのカードに出す短い名前 */
  shortTitle: string
  description: string
  /** 1問の制限時間 */
  timeLimitMs: number
}

export const DRILLS: DrillMeta[] = [
  {
    id: 'shotclock',
    route: '/drill/shotclock',
    role: 'sc-operator',
    icon: '⏱️',
    title: 'ショットクロック反射ドリル',
    shortTitle: '反射ドリル',
    description: '24 / 14 / 継続 / 止めるだけ を瞬時に判断',
    timeLimitMs: 5000,
  },
  {
    id: 'gameclock',
    route: '/drill/gameclock',
    role: 'timer',
    icon: '⏰',
    title: 'ゲームクロック判断ドリル',
    shortTitle: 'クロックドリル',
    description: 'スタート / ストップ / 何もしない を瞬時に判断',
    timeLimitMs: 5000,
  },
  {
    id: 'sheet',
    route: '/drill/sheet',
    role: 'scorer',
    icon: '📝',
    title: 'スコアシート記入ドリル',
    shortTitle: '記入ドリル',
    description: '得点・ファウル・タイムアウトを正しい記号と色で記入',
    timeLimitMs: 30000,
  },
]

export function drillsForRole(role: ToRole): DrillMeta[] {
  return DRILLS.filter((d) => d.role === role)
}
