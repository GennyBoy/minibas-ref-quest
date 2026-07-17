import { q1U12Script } from './scripts/q1-u12'
import type { GameScript } from './types'

export * from './types'
export { q1U12Script }

/** 全台本（id で引く場合は findScript を使う） */
export const gameScripts: GameScript[] = [q1U12Script]

export function findScript(id: string): GameScript | undefined {
  return gameScripts.find((s) => s.id === id)
}
