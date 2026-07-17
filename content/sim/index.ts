import { gameU12Script } from './scripts/game-u12'
import type { GameScript } from './types'

export * from './types'
export { gameU12Script }

/** 全台本（id で引く場合は findScript を使う） */
export const gameScripts: GameScript[] = [gameU12Script]

export function findScript(id: string): GameScript | undefined {
  return gameScripts.find((s) => s.id === id)
}
