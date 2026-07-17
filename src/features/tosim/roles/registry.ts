import type { ComponentType } from 'react'
import type { PenColor, PlacedMark, Team } from '../../../../content/drills/types'
import type { GameScript } from '../../../../content/sim/types'
import type { ToRole } from '../../../../content/types'
import type { SimStep } from '../steps'
import type { RoleExpect, SimInput } from '../types'
import type { GradeResult } from './graders'
import { scOperatorPlugin } from './sc-operator/plugin'
import { scorerPlugin } from './scorer/plugin'

/**
 * シミュレーターの役割プラグイン。役割を追加するときは
 * (1) content/sim/types.ts に expect スキーマ (2) roles/<role>/ に Panel・Feedback
 * (3) ここへの登録 (4) 台本の expect に該当役割のキー、の4点だけ足せばよい
 * （steps.ts・SimShell・ルートは無変更）。
 */

/** 盤面の確定状態（台本が正: prefill＋回答済みステップの期待マークから導出） */
export interface SimBoard {
  marks: PlacedMark[]
  arrow: Team | null
}

export interface SimPanelProps {
  step: SimStep
  script: GameScript
  board: SimBoard
  /** セッション横断で持つペンの色（scorer用。他役割は無視してよい） */
  pen: PenColor
  setPen: (c: PenColor) => void
  onSubmit: (input: SimInput) => void
}

export interface SimFeedbackProps {
  step: SimStep
  input: SimInput
  grade: GradeResult
  script: GameScript
  board: SimBoard
}

export interface SimRolePlugin {
  role: ToRole
  icon: string
  /** 役割ハブのカードに出す短い名前 */
  shortTitle: string
  description: string
  Panel: ComponentType<SimPanelProps>
  /** 答え合わせカードの中身（正解・解説・記入例など） */
  Feedback: ComponentType<SimFeedbackProps>
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
