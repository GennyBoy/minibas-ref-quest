import { describe, it, expect } from 'vitest'
import { gameScripts, q1U12Script } from '../content/sim'
import type { GameScript } from '../content/sim'
import { validateSimScript } from '../src/features/tosim/validate'

/** イベントの一部を差し替えた壊れ台本を作る（検証が壊れを検出できることの確認用） */
function broken(mutate: (s: GameScript) => void): GameScript {
  const copy: GameScript = structuredClone(q1U12Script)
  mutate(copy)
  return copy
}

describe('validateSimScript', () => {
  it('全台本が検証を通過する', () => {
    for (const s of gameScripts) {
      expect(validateSimScript(s), s.id).toEqual([])
    }
  })

  it('periodStart で始まり periodEnd（残り0）で終わる', () => {
    const first = q1U12Script.events[0]
    const last = q1U12Script.events[q1U12Script.events.length - 1]
    expect(first.type).toBe('periodStart')
    expect(first.gameClockMs).toBe(q1U12Script.quarterMs)
    expect(last.type).toBe('periodEnd')
    expect(last.gameClockMs).toBe(0)
  })

  it('gameClockMs の食い違いを検出する', () => {
    const s = broken((s) => {
      s.events[2].gameClockMs += 1000
    })
    expect(validateSimScript(s).some((e) => e.includes('gameClockMs'))).toBe(true)
  })

  it('atMs の逆行を検出する', () => {
    const s = broken((s) => {
      s.events[3].atMs = s.events[2].atMs
    })
    expect(validateSimScript(s).some((e) => e.includes('atMs'))).toBe(true)
  })

  it('ショットクロック切れを検出する', () => {
    const s = broken((s) => {
      // ev-002（FG）を大幅に遅らせると24秒を超える（gameClockMsは辻褄を合わせる）
      const shifted = 10000
      for (let i = 1; i < s.events.length; i++) s.events[i].atMs += shifted
      s.events[1].atMs += 5000
      s.events[1].gameClockMs -= 5000
    })
    expect(validateSimScript(s).some((e) => e.includes('ショットクロック'))).toBe(true)
  })

  it('SC期待と clock.shot の食い違いを検出する', () => {
    const s = broken((s) => {
      const ev = s.events.find((e) => e.expect['sc-operator']?.action === 'reset14')
      if (ev) ev.clock.shot = 24
    })
    expect(validateSimScript(s).some((e) => e.includes('reset14'))).toBe(true)
  })

  it('ファウル枠の飛ばしを検出する', () => {
    const s = broken((s) => {
      const ev = s.events.find((e) => {
        const ex = e.expect.scorer
        return ex?.kind === 'mark' && ex.mark.cell.kind === 'foul'
      })
      const ex = ev?.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'foul') ex.mark.cell.slot = 3
    })
    expect(validateSimScript(s).some((e) => e.includes('ファウル枠'))).toBe(true)
  })

  it('得点累計と合わない得点セルを検出する', () => {
    const s = broken((s) => {
      const ev = s.events.find((e) => e.type === 'fieldGoal')
      const ex = ev?.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'score') ex.mark.cell.score += 2
    })
    expect(validateSimScript(s).some((e) => e.includes('得点セル'))).toBe(true)
  })

  it('APアローの反転先の誤りを検出する', () => {
    const s = broken((s) => {
      const ev = s.events.find(
        (e) => e.expect.scorer?.kind === 'apArrow' && e.type === 'jumpBallSituation',
      )
      const ex = ev?.expect.scorer
      if (ex?.kind === 'apArrow') ex.to = ex.to === 'A' ? 'B' : 'A'
    })
    expect(validateSimScript(s).some((e) => e.includes('矢印'))).toBe(true)
  })

  it('ペンの色の誤りを検出する', () => {
    const s = broken((s) => {
      const ev = s.events.find((e) => e.expect.scorer?.kind === 'mark')
      const ex = ev?.expect.scorer
      if (ex?.kind === 'mark') ex.mark.color = 'dark'
    })
    expect(validateSimScript(s).some((e) => e.includes('ペンの色'))).toBe(true)
  })
})
