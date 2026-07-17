import { useEffect, useRef, useState } from 'react'
import type { GameScript } from '../../../content/sim/types'
import type { ToRole } from '../../../content/types'
import { formatGameClock, formatShotClock } from '../../lib/clock'
import {
  advanceTo,
  createEngine,
  gameClockMsAt,
  handleInput,
  shotClockMsAt,
  skipToNextEvent,
  type SimEngineState,
} from './engine'
import type { SimInput } from './types'

export const SIM_RATES = [0.5, 1, 1.5] as const
export type SimRate = (typeof SIM_RATES)[number]

export interface UseSimEngineResult {
  state: SimEngineState
  playing: boolean
  /** タブ非表示で自動一時停止した状態か（「タップで再開」表示用） */
  pausedByHidden: boolean
  rate: SimRate
  gameText: string
  /** null = 非表示状態 */
  shotText: string | null
  play: () => void
  pause: () => void
  setRate: (rate: SimRate) => void
  stepEvent: () => void
  submitInput: (input: SimInput) => void
}

interface SimController {
  play: () => void
  pause: (pausedByHidden?: boolean) => void
  setRate: (rate: SimRate) => void
  stepEvent: () => void
  submitInput: (input: SimInput) => void
  dispose: () => void
}

/**
 * performance.now() + requestAnimationFrame 駆動の台本再生。
 * simMs = 基準点 + 経過実時間 × 倍率。エンジン状態はイベント境界（発火・
 * ウィンドウ確定・操作）でだけ差し替え、描画は文字列の変化か100msごとに抑える。
 * script / role の途中変更には追従しないので、呼び出し側で key を変えて作り直す。
 */
export function useSimEngine(script: GameScript, role: ToRole): UseSimEngineResult {
  // 初期状態では advanceTo を呼ばない（atMs=0 のイベントは再生開始後に発火させる）
  const [view, setView] = useState(() => {
    const state = createEngine(script, role)
    return {
      state,
      playing: false,
      pausedByHidden: false,
      rate: 1 as SimRate,
      gameText: formatGameClock(gameClockMsAt(state, 0)),
      shotText: fmtShot(shotClockMsAt(state, 0)),
    }
  })

  const ctrlRef = useRef<SimController | null>(null)
  if (ctrlRef.current === null) {
    let engine = createEngine(script, role)
    let playing = false
    let rate: SimRate = 1
    let simMsBase = 0
    let syncedAt = 0
    let raf: number | null = null
    let lastPush = 0
    let lastGameText = ''
    let lastShotText: string | null = ''

    const currentSimMs = (now: number) =>
      playing ? simMsBase + (now - syncedAt) * rate : simMsBase

    const stopLoop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf)
        raf = null
      }
    }

    const push = (now: number, pausedByHidden = false) => {
      const simMs = currentSimMs(now)
      lastGameText = formatGameClock(gameClockMsAt(engine, simMs))
      lastShotText = fmtShot(shotClockMsAt(engine, simMs))
      lastPush = now
      setView({
        state: engine,
        playing,
        pausedByHidden,
        rate,
        gameText: lastGameText,
        shotText: lastShotText,
      })
    }

    /** simMs までエンジンを進め、境界をまたいだかを返す */
    const settle = (simMs: number): boolean => {
      const next = advanceTo(engine, simMs)
      const crossed =
        next.nextEventIdx !== engine.nextEventIdx ||
        next.results.length !== engine.results.length ||
        next.status !== engine.status
      if (crossed) engine = next
      return crossed
    }

    const tick = () => {
      const now = performance.now()
      const simMs = currentSimMs(now)
      const crossed = settle(simMs)
      if (engine.status === 'finished') {
        playing = false
        simMsBase = engine.simMs
        stopLoop()
        push(now)
        return
      }
      const gameText = formatGameClock(gameClockMsAt(engine, simMs))
      const shotText = fmtShot(shotClockMsAt(engine, simMs))
      if (crossed || gameText !== lastGameText || shotText !== lastShotText || now - lastPush >= 100) {
        push(now)
      }
      raf = requestAnimationFrame(tick)
    }

    ctrlRef.current = {
      play: () => {
        if (playing || engine.status === 'finished') return
        syncedAt = performance.now()
        playing = true
        push(syncedAt)
        if (raf === null) raf = requestAnimationFrame(tick)
      },
      pause: (pausedByHidden = false) => {
        if (!playing) return
        const now = performance.now()
        simMsBase = currentSimMs(now)
        playing = false
        stopLoop()
        settle(simMsBase)
        push(now, pausedByHidden)
      },
      setRate: (r: SimRate) => {
        const now = performance.now()
        simMsBase = currentSimMs(now)
        syncedAt = now
        rate = r
        push(now)
      },
      stepEvent: () => {
        const now = performance.now()
        settle(currentSimMs(now))
        engine = skipToNextEvent(engine)
        simMsBase = engine.simMs
        syncedAt = now
        if (engine.status === 'finished') {
          playing = false
          stopLoop()
        }
        push(now)
      },
      submitInput: (input: SimInput) => {
        const now = performance.now()
        const simMs = currentSimMs(now)
        engine = handleInput(engine, input, simMs)
        if (engine.status === 'finished') {
          playing = false
          simMsBase = engine.simMs
          stopLoop()
        }
        push(now)
      },
      dispose: stopLoop,
    }
  }
  const ctrl = ctrlRef.current

  // タブ非表示 → 自動一時停止（rAFが止まる環境でも時間が進まないようにする）
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) ctrl.pause(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      ctrl.dispose()
    }
  }, [ctrl])

  return {
    state: view.state,
    playing: view.playing,
    pausedByHidden: view.pausedByHidden,
    rate: view.rate,
    gameText: view.gameText,
    shotText: view.shotText,
    play: ctrl.play,
    pause: () => ctrl.pause(false),
    setRate: ctrl.setRate,
    stepEvent: ctrl.stepEvent,
    submitInput: ctrl.submitInput,
  }
}

function fmtShot(ms: number | null): string | null {
  return ms === null ? null : formatShotClock(ms)
}
