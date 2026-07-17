import type { PenColor, PlacedMark, Quarter, Team } from '../../../content/drills/types'
import type { GameScript, SimEvent } from '../../../content/sim/types'
import type { ToRole } from '../../../content/types'
import { penColorForQuarter } from '../../lib/scoresheet'
import type { RoleExpect, SimInputKind } from './types'
import { kindOf } from './types'

/**
 * ターン制セッションの純ロジック（React非依存）。
 * 台本から「その役割の期待があるイベント」をステップ列として導出し、
 * Q途中開始のシート状態（記入・APアロー・ペン）を復元する。
 */

export type SimSegment = 'full' | 1 | 2 | 3 | 4
export const SIM_SEGMENTS: SimSegment[] = ['full', 1, 2, 3, 4]

/** クォーターの並び順（OTは第4Qの後） */
export const QUARTER_ORDER: Quarter[] = [1, 2, 3, 4, 'OT']
export function quarterIndex(q: Quarter): number {
  return QUARTER_ORDER.indexOf(q)
}

export function segmentLabel(segment: SimSegment): string {
  return segment === 'full' ? '1試合通し' : `第${segment}Qのみ`
}

export interface SimStep {
  index: number
  event: SimEvent
  kind: SimInputKind
  expect: RoleExpect
  explanation: string
  /** 前ステップからこのイベントまでの、期待なしイベント（「その間の出来事」表示用） */
  between: SimEvent[]
  /** セグメント内でこの直前に起きたイベント（between が空のときの文脈表示用） */
  prev: SimEvent | null
  /** イベント発生直前のショットクロック残りms（null=非表示） */
  shotBeforeMs: number | null
}

export interface SimSessionPlan {
  segment: SimSegment
  steps: SimStep[]
  /** Q途中開始時に盤面へ転記する確定済みマーク（開始Qより前の全 scorer mark 期待） */
  prefill: PlacedMark[]
  /** 開始時点のAPアロー（開始Qより前の最後の apArrow 期待。無ければ null） */
  initialArrow: Team | null
  /** 開始時にトレイに載っているペン（前Qの色。Q1/通しは試合前記入の続きで濃色） */
  initialPen: PenColor
  /** 最終ステップより後の期待なしイベント（結果画面のエピローグ表示用） */
  epilogue: SimEvent[]
}

/**
 * ショットクロックの畳み込み。SCはゲームクロックが動いている間だけ減るため、
 * イベント間の減少量 = gameClockMs の差分（periodStart で quarterMs に戻る）。
 * 各イベントの「発生直前」の残りmsを返す（負値あり = SC切れ。validateが検出する）。
 * type: 'play' は複数ポゼッションの圧縮イベントなので減算をスキップし、
 * その shot 指示から畳み込みを再開する。
 */
export function foldShotClock(events: SimEvent[], quarterMs: number): (number | null)[] {
  const before: (number | null)[] = []
  let shotMs: number | null = null
  let prevGcMs = quarterMs
  for (const e of events) {
    if (e.type === 'periodStart') prevGcMs = quarterMs
    if (e.type === 'play') {
      before.push(null)
    } else {
      const delta = prevGcMs - e.gameClockMs
      if (shotMs !== null && delta > 0) shotMs -= delta
      before.push(shotMs)
    }
    if (typeof e.shot === 'number') shotMs = e.shot * 1000
    else if (e.shot === 'hide') shotMs = null
    prevGcMs = e.gameClockMs
  }
  return before
}

function expectFor(event: SimEvent, role: ToRole): RoleExpect | undefined {
  if (role === 'sc-operator') return event.expect['sc-operator']
  if (role === 'scorer') return event.expect.scorer
  return undefined
}

/** イベント列から scorer 期待のマークを畳み込む（盤面転記・prefill用） */
export function foldScorerMarks(events: SimEvent[]): PlacedMark[] {
  const marks: PlacedMark[] = []
  for (const e of events) {
    const ex = e.expect.scorer
    if (ex?.kind === 'mark') marks.push(ex.mark)
  }
  return marks
}

/** イベント列から最後のAPアローの向きを畳み込む（未設定は null） */
export function foldArrow(events: SimEvent[]): Team | null {
  let arrow: Team | null = null
  for (const e of events) {
    const ex = e.expect.scorer
    if (ex?.kind === 'apArrow') arrow = ex.to
  }
  return arrow
}

export function buildSession(script: GameScript, role: ToRole, segment: SimSegment): SimSessionPlan {
  const shotBefore = foldShotClock(script.events, script.quarterMs)
  const inSegment = (e: SimEvent) => segment === 'full' || e.quarter === segment
  const before =
    segment === 'full'
      ? []
      : script.events.filter((e) => quarterIndex(e.quarter) < quarterIndex(segment))

  const steps: SimStep[] = []
  let between: SimEvent[] = []
  let prev: SimEvent | null = null
  script.events.forEach((e, i) => {
    if (!inSegment(e)) return
    const expect = expectFor(e, role)
    if (!expect) {
      between.push(e)
      prev = e
      return
    }
    steps.push({
      index: steps.length,
      event: e,
      kind: kindOf(expect),
      expect,
      explanation: expect.explanation,
      between,
      prev,
      shotBeforeMs: shotBefore[i],
    })
    between = []
    prev = e
  })

  return {
    segment,
    steps,
    prefill: foldScorerMarks(before),
    initialArrow: foldArrow(before),
    initialPen:
      segment === 'full' || segment === 1
        ? 'dark'
        : penColorForQuarter((segment - 1) as Quarter),
    epilogue: between,
  }
}
