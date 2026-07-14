import type { Question, ToRole } from '../../content'
import { TO_ROLES } from '../../content'
import type { SrsState } from './srs'
import { mastery } from './mastery'

export const BADGE_THRESHOLD = 0.7

export function questionIdsForRole(questions: Question[], role: ToRole): string[] {
  return questions.filter((q) => q.roles?.includes(role)).map((q) => q.id)
}

export function roleMastery(
  questions: Question[],
  role: ToRole,
  srs: Record<string, SrsState>,
  now: number,
): number {
  return mastery(questionIdsForRole(questions, role), srs, now)
}

/** 役割バッジ獲得済みか（Phase 2でドリル基準スコアの条件が加わる予定） */
export function hasBadge(
  questions: Question[],
  role: ToRole,
  srs: Record<string, SrsState>,
  now: number,
): boolean {
  return roleMastery(questions, role, srs, now) >= BADGE_THRESHOLD
}

/** 全役割制覇＝TOマスター */
export function isToMaster(
  questions: Question[],
  srs: Record<string, SrsState>,
  now: number,
): boolean {
  return TO_ROLES.every((role) => hasBadge(questions, role, srs, now))
}
