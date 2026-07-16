import { useEffect, useRef, useState } from 'react'
import type { ClockState } from '../../lib/clock'
import { createClock, start, stop, reset, remaining } from '../../lib/clock'

export interface UseClockResult {
  /** フォーマット済みの表示文字列 */
  text: string
  /** 残りミリ秒（表示更新のタイミングでのみ更新。バー表示用） */
  msLeft: number
  running: boolean
  /** タブ非表示で自動一時停止した状態か（「タップで再開」表示用） */
  pausedByHidden: boolean
  start: () => void
  stop: () => void
  reset: (ms: number, autoStart?: boolean) => void
}

interface ClockController {
  start: () => void
  stop: (pausedByHidden?: boolean) => void
  reset: (ms: number, autoStart?: boolean) => void
  dispose: () => void
}

/**
 * performance.now() + requestAnimationFrame 駆動のクロック。
 * setState は表示文字列が変わるか100ms経過したときだけ行い、描画負荷を抑える。
 * タブ非表示（バックグラウンド移行）で自動一時停止するため、復帰時に時間が飛ばない。
 */
export function useClock(
  initialMs: number,
  format: (ms: number) => string,
  opts?: { onZero?: () => void },
): UseClockResult {
  const onZeroRef = useRef(opts?.onZero)
  onZeroRef.current = opts?.onZero
  const formatRef = useRef(format)
  formatRef.current = format

  const [view, setView] = useState(() => ({
    text: format(initialMs),
    msLeft: initialMs,
    running: false,
    pausedByHidden: false,
  }))

  const ctrlRef = useRef<ClockController | null>(null)
  if (ctrlRef.current === null) {
    let clock: ClockState = createClock(initialMs)
    let raf: number | null = null
    let lastText = format(initialMs)
    let lastPush = 0

    const push = (now: number, pausedByHidden = false) => {
      const ms = remaining(clock, now)
      lastText = formatRef.current(ms)
      lastPush = now
      setView({ text: lastText, msLeft: ms, running: clock.running, pausedByHidden })
    }

    const stopLoop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf)
        raf = null
      }
    }

    const tick = () => {
      const now = performance.now()
      const ms = remaining(clock, now)
      if (ms <= 0) {
        clock = stop(clock, now)
        stopLoop()
        push(now)
        onZeroRef.current?.()
        return
      }
      if (formatRef.current(ms) !== lastText || now - lastPush >= 100) push(now)
      raf = requestAnimationFrame(tick)
    }

    ctrlRef.current = {
      start: () => {
        const now = performance.now()
        clock = start(clock, now)
        push(now)
        if (clock.running && raf === null) raf = requestAnimationFrame(tick)
      },
      stop: (pausedByHidden = false) => {
        if (!clock.running) return
        const now = performance.now()
        clock = stop(clock, now)
        stopLoop()
        push(now, pausedByHidden)
      },
      reset: (ms: number, autoStart = false) => {
        clock = reset(clock, ms)
        stopLoop()
        if (autoStart) {
          ctrlRef.current?.start()
        } else {
          push(performance.now())
        }
      },
      dispose: stopLoop,
    }
  }
  const ctrl = ctrlRef.current

  // タブ非表示 → 自動一時停止（rAFが止まる環境でも時間が進まないようにする）
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) ctrl.stop(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      ctrl.dispose()
    }
  }, [ctrl])

  return {
    text: view.text,
    msLeft: view.msLeft,
    running: view.running,
    pausedByHidden: view.pausedByHidden,
    start: ctrl.start,
    stop: () => ctrl.stop(false),
    reset: ctrl.reset,
  }
}
