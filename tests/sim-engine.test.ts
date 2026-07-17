import { describe, it, expect } from 'vitest'
import type { GameScript, SimEvent } from '../content/sim/types'
import {
  advanceTo,
  createEngine,
  firedEvents,
  gameClockMsAt,
  handleInput,
  shotClockMsAt,
  skipToNextEvent,
} from '../src/features/tosim/engine'

/** エンジンテスト用の小さな台本（SC窓=既定6000ms、mark窓=既定20000ms） */
function ev(partial: Partial<SimEvent> & Pick<SimEvent, 'id' | 'atMs' | 'gameClockMs'>): SimEvent {
  return {
    type: 'fieldGoal',
    narration: 'テストイベント',
    clock: { game: 'none', shot: 'none' },
    expect: {},
    refs: ['knowledge/09-to-timer-shotclock'],
    ...partial,
  }
}

const script: GameScript = {
  id: 'sim-test',
  title: 'エンジンテスト台本',
  description: 'エンジンの単体テストに使う最小の台本',
  ruleset: 'u12',
  quarter: 1,
  quarterMs: 60000,
  ruleYear: 2026,
  events: [
    ev({
      id: 'ev-001',
      atMs: 0,
      gameClockMs: 60000,
      type: 'periodStart',
      clock: { game: 'start', shot: 24 },
      expect: { 'sc-operator': { action: 'reset24' } },
    }),
    ev({
      id: 'ev-002',
      atMs: 10000,
      gameClockMs: 50000,
      clock: { game: 'none', shot: 24 },
      expect: {
        'sc-operator': { action: 'reset24' },
        scorer: {
          kind: 'mark',
          mark: {
            cell: { kind: 'score', team: 'A', score: 2 },
            mark: { symbol: 'fg', playerNo: 7 },
            color: 'red',
          },
        },
      },
    }),
    ev({
      id: 'ev-003',
      atMs: 14000,
      gameClockMs: 46000,
      type: 'outOfBounds',
      clock: { game: 'stop', shot: 'none' },
      expect: { 'sc-operator': { action: 'keep' } },
    }),
    ev({
      id: 'ev-004',
      atMs: 16000,
      gameClockMs: 46000,
      type: 'periodEnd',
      clock: { game: 'stop', shot: 'hide' },
      expect: {},
    }),
  ],
}

describe('advanceTo', () => {
  it('通過したイベントを発火して期待ウィンドウを開く', () => {
    const s = advanceTo(createEngine(script, 'sc-operator'), 0)
    expect(s.nextEventIdx).toBe(1)
    expect(s.pending).toHaveLength(1)
    expect(s.pending[0].event.id).toBe('ev-001')
    expect(s.pending[0].closesAtMs).toBe(6000)
  })

  it('閉じたウィンドウを missed で確定する', () => {
    const s = advanceTo(createEngine(script, 'sc-operator'), 7000)
    expect(s.pending).toHaveLength(0)
    expect(s.results).toHaveLength(1)
    expect(s.results[0]).toMatchObject({ outcome: 'missed', input: null, delayMs: null })
  })

  it('期待のない役割はウィンドウを開かない（見てるだけ）', () => {
    const s = advanceTo(createEngine(script, 'scorer'), 1000)
    expect(s.nextEventIdx).toBe(1)
    expect(s.pending).toHaveLength(0)
  })

  it('最終イベント通過＋全ウィンドウ確定で finished になる', () => {
    const s = advanceTo(createEngine(script, 'sc-operator'), 100000)
    expect(s.status).toBe('finished')
    expect(s.results).toHaveLength(3)
    expect(s.results.every((r) => r.outcome === 'missed')).toBe(true)
  })

  it('発火済みイベントを新しい順で返す', () => {
    const s = advanceTo(createEngine(script, 'sc-operator'), 15000)
    expect(firedEvents(s).map((e) => e.id)).toEqual(['ev-003', 'ev-002', 'ev-001'])
  })
})

describe('handleInput', () => {
  it('ウィンドウ内の正しい操作を correct + 遅延つきで確定する', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 1500)
    s = handleInput(s, { kind: 'sc', action: 'reset24' }, 1500)
    expect(s.results).toHaveLength(1)
    expect(s.results[0]).toMatchObject({ outcome: 'correct', delayMs: 1500 })
    expect(s.pending).toHaveLength(0)
  })

  it('ウィンドウ内の誤った操作を wrong にする', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 1000)
    s = handleInput(s, { kind: 'sc', action: 'reset14' }, 1000)
    expect(s.results[0].outcome).toBe('wrong')
  })

  it('ウィンドウが開いていない操作は falseInput として記録する', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 8000)
    s = handleInput(s, { kind: 'sc', action: 'reset24' }, 8000)
    expect(s.results).toHaveLength(1) // ev-001 の missed のみ
    expect(s.falseInputs).toHaveLength(1)
    expect(s.falseInputs[0].nearEventId).toBe('ev-001')
  })

  it('同種のウィンドウが重なったら最古を先に照合する', () => {
    // ev-002(10s) と ev-003(14s) のSCウィンドウが重なる時刻 15s で押す
    let s = advanceTo(createEngine(script, 'sc-operator'), 15000)
    expect(s.pending).toHaveLength(2)
    s = handleInput(s, { kind: 'sc', action: 'reset24' }, 15000)
    expect(s.results.at(-1)).toMatchObject({ outcome: 'correct', delayMs: 5000 })
    expect(s.results.at(-1)?.event.id).toBe('ev-002')
    s = handleInput(s, { kind: 'sc', action: 'keep' }, 16000)
    expect(s.results.at(-1)).toMatchObject({ outcome: 'correct' })
    expect(s.results.at(-1)?.event.id).toBe('ev-003')
  })

  it('スコアラーの mark 操作は記入内訳（entryGrade）つきで採点する', () => {
    let s = advanceTo(createEngine(script, 'scorer'), 11000)
    s = handleInput(
      s,
      {
        kind: 'mark',
        mark: {
          cell: { kind: 'score', team: 'A', score: 2 },
          mark: { symbol: 'fg', playerNo: 7 },
          color: 'dark', // ペンの色だけ間違い
        },
      },
      11000,
    )
    expect(s.results[0].outcome).toBe('wrong')
    expect(s.results[0].entryGrade).toMatchObject({ cell: true, symbol: true, color: false })
  })
})

describe('skipToNextEvent', () => {
  it('次のイベントまでジャンプし、飛ばしたウィンドウは missed になる', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 1000)
    s = skipToNextEvent(s) // ev-002 (10s) へ
    expect(s.simMs).toBe(10000)
    expect(s.nextEventIdx).toBe(2)
    expect(s.results[0]).toMatchObject({ outcome: 'missed' }) // ev-001 の窓(6s)は通過
  })

  it('イベントが残っていなければ残りのウィンドウを確定して終了する', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 17000)
    expect(s.status).toBe('playing') // 全イベント発火済みだが ev-003 の窓が開いている
    s = skipToNextEvent(s)
    expect(s.status).toBe('finished')
  })
})

describe('クロック導出', () => {
  it('ゲームクロックは running 中だけ減る', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 5000)
    expect(gameClockMsAt(s, 5000)).toBe(55000)
    s = advanceTo(s, 14000) // ev-003 で stop
    expect(gameClockMsAt(s, 20000)).toBe(46000)
  })

  it('ショットクロックはセット・非表示の指示に従う', () => {
    let s = advanceTo(createEngine(script, 'sc-operator'), 5000)
    expect(shotClockMsAt(s, 5000)).toBe(19000) // 24 - 5s
    s = advanceTo(s, 10000) // ev-002 で 24 に再セット
    expect(shotClockMsAt(s, 12000)).toBe(22000)
    s = advanceTo(s, 16000) // ev-004 で hide
    expect(shotClockMsAt(s, 16000)).toBeNull()
  })
})
