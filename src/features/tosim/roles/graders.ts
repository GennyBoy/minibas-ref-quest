import type { EntryGrade } from '../../../lib/scoresheet'
import { gradeEntry } from '../../../lib/scoresheet'
import type { RoleExpect, SimInput } from '../types'

/**
 * 期待アクションと操作の照合（React非依存の純関数。エンジンから呼ぶ）。
 * 役割を追加するときは RoleExpect の union と、ここの分岐を足す。
 */
export interface GradeResult {
  correct: boolean
  /** スコアシート記入の内訳（mark 期待のときだけ） */
  entryGrade?: EntryGrade
}

export function gradeInput(expect: RoleExpect, input: SimInput): GradeResult {
  if ('action' in expect) {
    return { correct: input.kind === 'sc' && input.action === expect.action }
  }
  if (expect.kind === 'mark') {
    if (input.kind !== 'mark') return { correct: false }
    const g = gradeEntry(expect.mark, input.mark)
    return { correct: g.all, entryGrade: g }
  }
  return { correct: input.kind === 'apArrow' && input.to === expect.to }
}
