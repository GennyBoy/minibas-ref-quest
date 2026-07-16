import { describe, it, expect } from 'vitest'
import {
  createClock,
  start,
  stop,
  reset,
  remaining,
  formatGameClock,
  formatShotClock,
} from '../src/lib/clock'

describe('clock state', () => {
  it('start→経過→remaining が減る', () => {
    let c = createClock(24000)
    c = start(c, 1000)
    expect(remaining(c, 1000)).toBe(24000)
    expect(remaining(c, 3500)).toBe(21500)
  })

  it('stop で経過分を折りたたみ、停止中は減らない', () => {
    let c = createClock(24000)
    c = start(c, 0)
    c = stop(c, 4000)
    expect(remaining(c, 4000)).toBe(20000)
    expect(remaining(c, 100000)).toBe(20000) // 停止中に時間が飛ばない
  })

  it('stop→(間が空く)→start で時間をロスしない', () => {
    let c = createClock(10000)
    c = start(c, 0)
    c = stop(c, 2000) // 残り8000
    c = start(c, 60000) // 58秒後に再開
    expect(remaining(c, 61000)).toBe(7000)
  })

  it('0未満にならずクランプされる', () => {
    let c = createClock(1000)
    c = start(c, 0)
    expect(remaining(c, 5000)).toBe(0)
  })

  it('残り0からは start できない', () => {
    let c = createClock(0)
    c = start(c, 0)
    expect(c.running).toBe(false)
  })

  it('reset で停止状態に戻る', () => {
    let c = createClock(24000)
    c = start(c, 0)
    c = reset(c, 14000)
    expect(c.running).toBe(false)
    expect(remaining(c, 99999)).toBe(14000)
  })

  it('二重startは無視される', () => {
    let c = createClock(10000)
    c = start(c, 0)
    const again = start(c, 5000)
    expect(again).toBe(c)
  })
})

describe('formatGameClock', () => {
  it('60秒以上は 分:秒', () => {
    expect(formatGameClock(360000)).toBe('6:00')
    expect(formatGameClock(61500)).toBe('1:01')
    expect(formatGameClock(60000)).toBe('1:00')
    expect(formatGameClock(599999)).toBe('9:59')
  })

  it('60秒未満は 秒.1/10秒', () => {
    expect(formatGameClock(59900)).toBe('59.9')
    expect(formatGameClock(59999)).toBe('59.9')
    expect(formatGameClock(5040)).toBe('5.0')
    expect(formatGameClock(0)).toBe('0.0')
  })
})

describe('formatShotClock', () => {
  it('切り上げ表示（実機と同じ）', () => {
    expect(formatShotClock(24000)).toBe('24')
    expect(formatShotClock(13500)).toBe('14')
    expect(formatShotClock(13000)).toBe('13')
    expect(formatShotClock(500)).toBe('1')
    expect(formatShotClock(0)).toBe('0')
  })
})
