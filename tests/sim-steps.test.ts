import { describe, it, expect } from 'vitest'
import { gameU12Script } from '../content/sim'
import {
  buildSession,
  foldArrow,
  foldScorerMarks,
  foldShotClock,
} from '../src/features/tosim/steps'

describe('foldShotClock', () => {
  it('ゲームクロック差分でSCが減り、セット指示で戻る', () => {
    const before = foldShotClock(gameU12Script.events, gameU12Script.quarterMs)
    // ev-001（開始前）は未セット
    expect(before[0]).toBeNull()
    // ev-002: ev-001 で 24 セット後、360000→339000 の21秒経過 → 残り3秒
    expect(before[1]).toBe(3000)
    // ev-006（OB, keep）: ev-005 で 24 セット後、290000→282000 の8秒経過 → 残り16秒
    expect(before[5]).toBe(16000)
  })

  it('hide 指示で null になり、次のセットまで続く', () => {
    const before = foldShotClock(gameU12Script.events, gameU12Script.quarterMs)
    const i = gameU12Script.events.findIndex((e) => e.id === 'ev-009') // FT1本目（ev-008でhide）
    expect(before[i]).toBeNull()
  })

  it('SCが切れる台本では負値を返す（validateが検出に使う）', () => {
    const events = structuredClone(gameU12Script.events)
    events[1].gameClockMs = events[0].gameClockMs - 25000
    const before = foldShotClock(events, gameU12Script.quarterMs)
    expect(before[1]).toBeLessThan(0)
  })
})

describe('buildSession', () => {
  it('締めの記帳（closing）はスコアラーのステップになり、SCでは between になる', () => {
    const scorer = buildSession(gameU12Script, 'scorer', 1)
    const closings = scorer.steps.filter((s) => s.event.type === 'closing')
    expect(closings.length).toBe(2) // 白・赤の得点の締め
    const sc = buildSession(gameU12Script, 'sc-operator', 1)
    expect(sc.steps.some((s) => s.event.type === 'closing')).toBe(false)
  })

  it('役割の期待があるイベントだけがステップになる', () => {
    const sc = buildSession(gameU12Script, 'sc-operator', 'full')
    const scorer = buildSession(gameU12Script, 'scorer', 'full')
    for (const s of sc.steps) expect(s.kind).toBe('sc')
    expect(scorer.steps.every((s) => s.kind === 'mark' || s.kind === 'apArrow')).toBe(true)
    expect(sc.steps.length).toBe(
      gameU12Script.events.filter((e) => e.expect['sc-operator']).length,
    )
    expect(scorer.steps.length).toBe(gameU12Script.events.filter((e) => e.expect.scorer).length)
  })

  it('期待なしイベントは between として次のステップに付く', () => {
    const scorer = buildSession(gameU12Script, 'scorer', 'full')
    // ev-012〜ev-013（リバウンド→FG）: scorer には ev-011/ev-012 が between になる
    const step = scorer.steps.find((s) => s.event.id === 'ev-013')
    expect(step?.between.map((e) => e.id)).toContain('ev-012')
  })

  it('SC出題にはイベント直前のSC残りが付く', () => {
    const sc = buildSession(gameU12Script, 'sc-operator', 'full')
    const ob = sc.steps.find((s) => s.event.id === 'ev-006')
    expect(ob?.shotBeforeMs).toBe(16000)
  })

  it('Q1/通し開始は prefill なし・アロー未設定・濃色ペン', () => {
    const plan = buildSession(gameU12Script, 'scorer', 'full')
    expect(plan.prefill).toEqual([])
    expect(plan.initialArrow).toBeNull()
    expect(plan.initialPen).toBe('dark')
  })

  it('Q2開始はQ1の記入・アロー・赤ペンを復元し、Q2のステップだけを出す', () => {
    const plan = buildSession(gameU12Script, 'scorer', 2)
    const q1 = gameU12Script.events.filter((e) => e.quarter === 1)
    expect(plan.prefill).toEqual(foldScorerMarks(q1))
    expect(plan.initialArrow).toBe(foldArrow(q1))
    expect(plan.initialPen).toBe('red') // 前Q（第1Q）の色のまま持ち替え待ち
    expect(plan.steps.length).toBeGreaterThan(0)
    expect(plan.steps.every((s) => s.event.quarter === 2)).toBe(true)
  })

  it('Q3開始の prefill はQ1・Q2の記入をすべて含む', () => {
    const plan = buildSession(gameU12Script, 'scorer', 3)
    const firstHalf = gameU12Script.events.filter((e) => e.quarter === 1 || e.quarter === 2)
    expect(plan.prefill).toEqual(foldScorerMarks(firstHalf))
    expect(plan.initialPen).toBe('dark') // 前Q（第2Q）の色
    expect(plan.steps.every((s) => s.event.quarter === 3)).toBe(true)
  })
})
