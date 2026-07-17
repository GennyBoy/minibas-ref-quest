import { describe, it, expect } from 'vitest'
import { gameScripts, gameU12Script } from '../content/sim'
import type { GameScript, SimEvent } from '../content/sim'
import { validateSimScript } from '../src/features/tosim/validate'

/** イベントの一部を差し替えた壊れ台本を作る（検証が壊れを検出できることの確認用） */
function broken(mutate: (s: GameScript) => void): GameScript {
  const copy: GameScript = structuredClone(gameU12Script)
  mutate(copy)
  return copy
}

function findEvent(s: GameScript, pred: (e: SimEvent) => boolean): SimEvent {
  const ev = s.events.find(pred)
  if (!ev) throw new Error('テスト対象のイベントが台本にありません')
  return ev
}

describe('validateSimScript', () => {
  it('全台本が検証を通過する', () => {
    for (const s of gameScripts) {
      expect(validateSimScript(s), s.id).toEqual([])
    }
  })

  it('periodStart で始まり、末尾は締めの記帳（残り0）で終わる', () => {
    const first = gameU12Script.events[0]
    const last = gameU12Script.events[gameU12Script.events.length - 1]
    expect(first.type).toBe('periodStart')
    expect(first.gameClockMs).toBe(gameU12Script.quarterMs)
    expect(last.type).toBe('closing')
    expect(last.gameClockMs).toBe(0)
  })

  it('periodEnd の後に closing 以外を置くと検出する', () => {
    const s = broken((s) => {
      const i = s.events.findIndex((e) => e.type === 'periodEnd')
      const bad = structuredClone(s.events[i - 1]) // Q内の通常イベントを複製
      bad.id = 'ev-095'
      bad.gameClockMs = 0
      s.events.splice(i + 1, 0, bad)
    })
    expect(validateSimScript(s).some((e) => e.includes('closing だけ'))).toBe(true)
  })

  it('closing の締め線の枠飛ばしを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => {
        const ex = e.expect.scorer
        return (
          e.type === 'closing' && ex?.kind === 'mark' && ex.mark.mark.symbol === 'closeFoulsHalf'
        )
      })
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'foul') ex.mark.cell.slot = 5
    })
    expect(validateSimScript(s).some((e) => e.includes('ファウル枠'))).toBe(true)
  })

  it('使用済みタイムアウト枠への未使用締めを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => {
        const ex = e.expect.scorer
        return (
          ex?.kind === 'mark' &&
          ex.mark.mark.symbol === 'closeUnused' &&
          ex.mark.cell.kind === 'timeout' &&
          ex.mark.cell.team === 'A'
        )
      })
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'timeout') ex.mark.cell.row = '第1Q' // 白が使用済み
    })
    expect(validateSimScript(s).some((e) => e.includes('使用済みのタイムアウト枠'))).toBe(true)
  })

  it('Q内でゲームクロックが増えたら検出する', () => {
    const s = broken((s) => {
      s.events[2].gameClockMs = s.events[1].gameClockMs + 1000
    })
    expect(validateSimScript(s).some((e) => e.includes('ゲームクロックが増えている'))).toBe(true)
  })

  it('ショットクロック切れを検出する', () => {
    const s = broken((s) => {
      // ev-002（最初のFG）を25秒経過後にずらすと24秒を超える
      s.events[1].gameClockMs = s.events[0].gameClockMs - 25000
    })
    expect(validateSimScript(s).some((e) => e.includes('ショットクロック'))).toBe(true)
  })

  it('クォーターの逆行・閉じ忘れを検出する', () => {
    const reversed = broken((s) => {
      // 末尾に第1Qの periodStart をもう一度置く（第1Qは閉じ済み → 逆行）
      const start = structuredClone(s.events[0])
      start.id = 'ev-090'
      s.events.push(start)
    })
    expect(validateSimScript(reversed).some((e) => e.includes('逆行'))).toBe(true)

    const unclosed = broken((s) => {
      s.events[s.events.length - 1].type = 'fieldGoal'
    })
    expect(validateSimScript(unclosed).some((e) => e.includes('periodEnd'))).toBe(true)
  })

  it('SC期待と shot 指示の食い違いを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => e.expect['sc-operator']?.action === 'reset14')
      ev.shot = 24
    })
    expect(validateSimScript(s).some((e) => e.includes('reset14'))).toBe(true)
  })

  it('ファウル枠の飛ばしを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => {
        const ex = e.expect.scorer
        return ex?.kind === 'mark' && ex.mark.cell.kind === 'foul'
      })
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'foul') ex.mark.cell.slot = 3
    })
    expect(validateSimScript(s).some((e) => e.includes('ファウル枠'))).toBe(true)
  })

  it('得点累計と合わない得点セルを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => e.type === 'fieldGoal')
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark' && ex.mark.cell.kind === 'score') ex.mark.cell.score += 2
    })
    expect(validateSimScript(s).some((e) => e.includes('得点セル'))).toBe(true)
  })

  it('APアローの反転先の誤りを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(
        s,
        (e) => e.expect.scorer?.kind === 'apArrow' && e.type === 'jumpBallSituation',
      )
      const ex = ev.expect.scorer
      if (ex?.kind === 'apArrow') ex.to = ex.to === 'A' ? 'B' : 'A'
    })
    expect(validateSimScript(s).some((e) => e.includes('矢印'))).toBe(true)
  })

  it('ペンの色がQと合わないと検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => e.expect.scorer?.kind === 'mark')
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark') ex.mark.color = 'dark'
    })
    expect(validateSimScript(s).some((e) => e.includes('ペンの色'))).toBe(true)
  })

  it('closeGame は最終Q以外の締めに置けない', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => {
        const ex = e.expect.scorer
        return (
          e.type === 'closing' &&
          e.quarter === 1 &&
          ex?.kind === 'mark' &&
          ex.mark.mark.symbol === 'closeQ'
        )
      })
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark') ex.mark.mark.symbol = 'closeGame'
    })
    expect(validateSimScript(s).some((e) => e.includes('closeGame'))).toBe(true)
  })

  it('タイムアウトの経過分の誤りを検出する', () => {
    const s = broken((s) => {
      const ev = findEvent(s, (e) => e.type === 'timeout')
      const ex = ev.expect.scorer
      if (ex?.kind === 'mark') ex.mark.mark.value = 5
    })
    expect(validateSimScript(s).some((e) => e.includes('経過分'))).toBe(true)
  })
})
