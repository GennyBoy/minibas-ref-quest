import type { GameScript, SimEvent } from '../../../content/sim/types'
import { scWindowMs, scorerWindowMs } from '../../../content/sim/types'
import type { ToRole } from '../../../content/types'
import type { EntryGrade } from '../../lib/scoresheet'
import { gradeInput } from './roles/graders'
import type { RoleExpect, SimInput, SimInputKind } from './types'
import { kindOf } from './types'

/**
 * GameScript 再生の純状態機械。時刻は「台本タイムライン simMs（1倍速の実時間）」を
 * 引数で受け取る（rAF・倍率・一時停止は useSimEngine 側の責務）。
 * 盤面表示は台本が正: ユーザーの操作ミスでもクロックは台本どおり進む。
 */

/** 発生済みで、まだ操作を待っている期待アクション */
export interface PendingExpect {
  event: SimEvent
  kind: SimInputKind
  expect: RoleExpect
  opensAtMs: number
  closesAtMs: number
}

export interface SimEventResult {
  event: SimEvent
  kind: SimInputKind
  expect: RoleExpect
  outcome: 'correct' | 'wrong' | 'missed'
  input: SimInput | null
  /** イベント発生から操作までの遅延（missed は null） */
  delayMs: number | null
  windowMs: number
  entryGrade?: EntryGrade
}

/** 期待ウィンドウが開いていないタイミングでの押下（誤操作） */
export interface SimFalseInput {
  simMs: number
  input: SimInput
  /** 押下時点の直近イベント（振り返り表示用） */
  nearEventId: string | null
}

interface SimClockState {
  running: boolean
  /** simMsAt 時点のゲームクロック残り */
  gameMsAt: number
  /** simMsAt 時点のショットクロック残り（null=非表示） */
  shotMsAt: number | null
  simMsAt: number
}

export interface SimEngineState {
  script: GameScript
  role: ToRole
  status: 'playing' | 'finished'
  simMs: number
  nextEventIdx: number
  pending: PendingExpect[]
  results: SimEventResult[]
  falseInputs: SimFalseInput[]
  clock: SimClockState
}

export function createEngine(script: GameScript, role: ToRole): SimEngineState {
  return {
    script,
    role,
    status: 'playing',
    simMs: 0,
    nextEventIdx: 0,
    pending: [],
    results: [],
    falseInputs: [],
    clock: { running: false, gameMsAt: script.quarterMs, shotMsAt: null, simMsAt: 0 },
  }
}

function expectFor(event: SimEvent, role: ToRole): RoleExpect | undefined {
  if (role === 'sc-operator') return event.expect['sc-operator']
  if (role === 'scorer') return event.expect.scorer
  return undefined
}

function windowOf(expect: RoleExpect): number {
  return 'action' in expect ? scWindowMs(expect) : scorerWindowMs(expect)
}

function tickClock(c: SimClockState, simMs: number): { gameMs: number; shotMs: number | null } {
  const delta = c.running ? Math.max(0, simMs - c.simMsAt) : 0
  return {
    gameMs: Math.max(0, c.gameMsAt - delta),
    shotMs: c.shotMsAt === null ? null : Math.max(0, c.shotMsAt - delta),
  }
}

function applyClock(c: SimClockState, ev: SimEvent): SimClockState {
  // ゲームクロックは authored 値をそのまま採用してドリフトを消す
  let { shotMs } = tickClock(c, ev.atMs)
  let running = c.running
  if (ev.clock.game === 'start') running = true
  if (ev.clock.game === 'stop') running = false
  if (typeof ev.clock.shot === 'number') shotMs = ev.clock.shot * 1000
  else if (ev.clock.shot === 'hide') shotMs = null
  return { running, gameMsAt: ev.gameClockMs, shotMsAt: shotMs, simMsAt: ev.atMs }
}

/**
 * simMs まで進める: 途中で閉じたウィンドウを missed で確定し、通過したイベントを
 * 発火する（時刻順）。最終イベント通過＋全ウィンドウ確定で finished。
 */
export function advanceTo(state: SimEngineState, simMs: number): SimEngineState {
  if (state.status === 'finished' || simMs < state.simMs) return state
  const events = state.script.events
  let nextEventIdx = state.nextEventIdx
  let clock = state.clock
  const pending = [...state.pending]
  const results = [...state.results]

  for (;;) {
    const ev = events[nextEventIdx]
    const evAt = ev !== undefined && ev.atMs <= simMs ? ev.atMs : Infinity
    let closeIdx = -1
    let closeAt = Infinity
    for (let i = 0; i < pending.length; i++) {
      if (pending[i].closesAtMs <= simMs && pending[i].closesAtMs < closeAt) {
        closeAt = pending[i].closesAtMs
        closeIdx = i
      }
    }
    if (evAt === Infinity && closeIdx === -1) break
    if (closeAt <= evAt) {
      const [p] = pending.splice(closeIdx, 1)
      results.push({
        event: p.event,
        kind: p.kind,
        expect: p.expect,
        outcome: 'missed',
        input: null,
        delayMs: null,
        windowMs: p.closesAtMs - p.opensAtMs,
      })
    } else {
      clock = applyClock(clock, events[nextEventIdx])
      const ex = expectFor(events[nextEventIdx], state.role)
      if (ex) {
        pending.push({
          event: events[nextEventIdx],
          kind: kindOf(ex),
          expect: ex,
          opensAtMs: events[nextEventIdx].atMs,
          closesAtMs: events[nextEventIdx].atMs + windowOf(ex),
        })
      }
      nextEventIdx++
    }
  }

  const status = nextEventIdx >= events.length && pending.length === 0 ? 'finished' : 'playing'
  return { ...state, status, simMs, nextEventIdx, pending, results, clock }
}

/**
 * 役割パネルからの操作を照合する。開いている同種の最古ウィンドウと突き合わせ、
 * どのウィンドウも開いていなければ誤操作（falseInput）として記録する。
 */
export function handleInput(state: SimEngineState, input: SimInput, simMs: number): SimEngineState {
  const s = advanceTo(state, simMs)
  if (s.status === 'finished') return s
  // pending は発生順に並んでいるので findIndex が最古ウィンドウになる
  const idx = s.pending.findIndex((p) => p.kind === input.kind)
  if (idx === -1) {
    const nearEventId = s.nextEventIdx > 0 ? s.script.events[s.nextEventIdx - 1].id : null
    return { ...s, falseInputs: [...s.falseInputs, { simMs, input, nearEventId }] }
  }
  const p = s.pending[idx]
  const g = gradeInput(p.expect, input)
  const results = [
    ...s.results,
    {
      event: p.event,
      kind: p.kind,
      expect: p.expect,
      outcome: g.correct ? ('correct' as const) : ('wrong' as const),
      input,
      delayMs: Math.max(0, simMs - p.opensAtMs),
      windowMs: p.closesAtMs - p.opensAtMs,
      entryGrade: g.entryGrade,
    },
  ]
  const pending = s.pending.filter((_, i) => i !== idx)
  const status =
    s.nextEventIdx >= s.script.events.length && pending.length === 0 ? 'finished' : s.status
  return { ...s, status, pending, results }
}

/** イベント送り: 次のイベント発生時刻までジャンプ（飛ばしたウィンドウは missed 確定） */
export function skipToNextEvent(state: SimEngineState): SimEngineState {
  if (state.status === 'finished') return state
  const ev = state.script.events[state.nextEventIdx]
  const target =
    ev !== undefined
      ? Math.max(ev.atMs, state.simMs)
      : Math.max(state.simMs, ...state.pending.map((p) => p.closesAtMs))
  return advanceTo(state, target)
}

/** 表示用: simMs 時点のゲームクロック残りミリ秒 */
export function gameClockMsAt(state: SimEngineState, simMs: number): number {
  return tickClock(state.clock, Math.max(simMs, state.clock.simMsAt)).gameMs
}

/** 表示用: simMs 時点のショットクロック残りミリ秒（null=非表示） */
export function shotClockMsAt(state: SimEngineState, simMs: number): number | null {
  return tickClock(state.clock, Math.max(simMs, state.clock.simMsAt)).shotMs
}

/** 実況フィード用: 発火済みイベント（新しい順） */
export function firedEvents(state: SimEngineState): SimEvent[] {
  return state.script.events.slice(0, state.nextEventIdx).reverse()
}
