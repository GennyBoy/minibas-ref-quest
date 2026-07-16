import { describe, it, expect } from 'vitest'
import {
  penColorForQuarter,
  timeoutMinute,
  cellKey,
  nextFoulSlot,
  gradeEntry,
  validateSheetTasks,
} from '../src/lib/scoresheet'
import { sheetTasks } from '../content/drills'
import type { PlacedMark } from '../content/drills/types'

describe('penColorForQuarter', () => {
  it('赤=第1Q・第3Q / 濃色=第2Q・第4Q・OT', () => {
    expect(penColorForQuarter(1)).toBe('red')
    expect(penColorForQuarter(2)).toBe('dark')
    expect(penColorForQuarter(3)).toBe('red')
    expect(penColorForQuarter(4)).toBe('dark')
    expect(penColorForQuarter('OT')).toBe('dark')
  })
})

describe('timeoutMinute（経過分・切り上げ）', () => {
  it('knowledge/08 の実例と一致する', () => {
    // U12・6分Qで残り2:35 → 4
    expect(timeoutMinute(6, 155)).toBe(4)
    // 一般・10分Qで残り3:44 → 7
    expect(timeoutMinute(10, 224)).toBe(7)
  })

  it('ちょうどの分は切り上げない', () => {
    expect(timeoutMinute(10, 120)).toBe(8) // 残り2:00 → 経過8分ちょうど
    expect(timeoutMinute(6, 240)).toBe(2) // 残り4:00 → 経過2分ちょうど
  })
})

describe('nextFoulSlot', () => {
  const p = (slot: number): PlacedMark => ({
    cell: { kind: 'foul', team: 'A', row: '4', slot },
    mark: { symbol: 'P' },
    color: 'red',
  })

  it('prefillの次の枠を返す', () => {
    expect(nextFoulSlot([], 'A', '4')).toBe(1)
    expect(nextFoulSlot([p(1), p(2)], 'A', '4')).toBe(3)
  })

  it('他のプレーヤー・チームのファウルは数えない', () => {
    const other: PlacedMark = {
      cell: { kind: 'foul', team: 'B', row: '4', slot: 1 },
      mark: { symbol: 'P' },
      color: 'red',
    }
    expect(nextFoulSlot([other], 'A', '4')).toBe(1)
  })
})

describe('gradeEntry', () => {
  const expected: PlacedMark = {
    cell: { kind: 'foul', team: 'A', row: '5', slot: 2 },
    mark: { symbol: 'U', subscript: 2 },
    color: 'red',
  }

  it('完全一致で all=true', () => {
    const g = gradeEntry(expected, structuredClone(expected))
    expect(g).toEqual({ cell: true, symbol: true, detail: true, color: true, all: true })
  })

  it('ペンの色だけ間違い', () => {
    const g = gradeEntry(expected, { ...expected, color: 'dark' })
    expect(g.color).toBe(false)
    expect(g.cell && g.symbol && g.detail).toBe(true)
    expect(g.all).toBe(false)
  })

  it('記号だけ間違い（P₂ vs U₂）', () => {
    const g = gradeEntry(expected, { ...expected, mark: { symbol: 'P', subscript: 2 } })
    expect(g.symbol).toBe(false)
    expect(g.detail).toBe(true)
    expect(g.all).toBe(false)
  })

  it('添え字だけ間違い', () => {
    const g = gradeEntry(expected, { ...expected, mark: { symbol: 'U', subscript: 1 } })
    expect(g.detail).toBe(false)
    expect(g.symbol).toBe(true)
  })

  it('マスだけ間違い', () => {
    const g = gradeEntry(expected, {
      ...expected,
      cell: { kind: 'foul', team: 'A', row: '5', slot: 3 },
    })
    expect(g.cell).toBe(false)
    expect(g.symbol && g.detail && g.color).toBe(true)
  })

  it('playerNo は採点しない', () => {
    const a: PlacedMark = {
      cell: { kind: 'score', team: 'A', score: 7 },
      mark: { symbol: 'ft', playerNo: 4 },
      color: 'red',
    }
    const b: PlacedMark = { ...a, mark: { symbol: 'ft', playerNo: 99 } }
    expect(gradeEntry(a, b).all).toBe(true)
  })
})

describe('cellKey', () => {
  it('種類・チーム・位置で一意', () => {
    expect(cellKey({ kind: 'score', team: 'A', score: 7 })).not.toBe(
      cellKey({ kind: 'score', team: 'B', score: 7 }),
    )
    expect(cellKey({ kind: 'foul', team: 'A', row: '4', slot: 1 })).not.toBe(
      cellKey({ kind: 'foul', team: 'A', row: '4', slot: 2 }),
    )
  })
})

describe('sheet-tasks コンテンツの整合性', () => {
  it('全お題が記入ルールの機械検証を通過する', () => {
    expect(validateSheetTasks(sheetTasks)).toEqual([])
  })

  it('20お題以上・4カテゴリすべてに出題がある', () => {
    expect(sheetTasks.length).toBeGreaterThanOrEqual(20)
    for (const cat of ['score', 'foul', 'timeout', 'closing'] as const) {
      expect(
        sheetTasks.filter((t) => t.category === cat).length,
        cat,
      ).toBeGreaterThanOrEqual(3)
    }
  })
})
