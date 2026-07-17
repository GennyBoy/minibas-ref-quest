import type { ComponentType } from 'react'
import type { ToRole } from '../../../../content/types'
import type { SimEngineState } from '../engine'
import type { RoleExpect, SimInput } from '../types'
import { scOperatorPlugin } from './sc-operator/plugin'
import { scorerPlugin } from './scorer/plugin'

/**
 * シミュレーターの役割プラグイン。役割を追加するときは
 * (1) content/sim/types.ts に expect スキーマ (2) roles/<role>/ に Panel と describe
 * (3) ここへの登録 (4) 台本の expect に該当役割のキー、の4点だけ足せばよい
 * （エンジン・SimShell・ルートは無変更）。
 */
export interface SimPanelProps {
  state: SimEngineState
  gameText: string
  /** null = 非表示状態 */
  shotText: string | null
  onInput: (input: SimInput) => void
  disabled: boolean
}

export interface SimRolePlugin {
  role: ToRole
  icon: string
  /** 役割ハブのカードに出す短い名前 */
  shortTitle: string
  description: string
  Panel: ComponentType<SimPanelProps>
  /** 結果画面の「期待されていた操作」表示 */
  describeExpect: (expect: RoleExpect) => string
  /** 結果画面の「あなたの操作」表示 */
  describeInput: (input: SimInput) => string
}

export const SIM_ROLES: Partial<Record<ToRole, SimRolePlugin>> = {
  'sc-operator': scOperatorPlugin,
  scorer: scorerPlugin,
}

export function simPluginForRole(role: ToRole): SimRolePlugin | undefined {
  return SIM_ROLES[role]
}
