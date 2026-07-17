import type { PlacedMark, Team } from '../../../content/drills/types'
import type { GameScript, SimEvent } from '../../../content/sim/types'
import { gameScriptSchema } from '../../../content/sim/types'
import { nextFoulSlot, penColorForQuarter, timeoutMinute } from '../../lib/scoresheet'

/**
 * GameScript の整合性検証（スキーマより強い、ルール・クロック由来の不変条件）。
 * validate-content スクリプトとテストの両方から使う。
 * atMs と clock 指示の畳み込みから gameClockMs・ショットクロック残りを再計算して
 * authored 値と突合するため、台本の手計算ミスを機械検出できる。
 */
export function validateSimScript(script: GameScript): string[] {
  const errors: string[] = []
  const parsed = gameScriptSchema.safeParse(script)
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      errors.push(`${script.id ?? '(no id)'}: ${i.path.join('.')}: ${i.message}`)
    }
    return errors
  }

  const events = script.events
  const err = (e: SimEvent, msg: string) => errors.push(`${e.id}: ${msg}`)

  // ID重複・atMs狭義単調増加
  const seen = new Set<string>()
  for (const e of events) {
    if (seen.has(e.id)) err(e, 'ID重複')
    seen.add(e.id)
  }
  for (let i = 1; i < events.length; i++) {
    if (events[i].atMs <= events[i - 1].atMs) {
      err(events[i], `atMs が前のイベント以下（${events[i].atMs} <= ${events[i - 1].atMs}）`)
    }
  }

  // 先頭・末尾のイベント
  const first = events[0]
  const last = events[events.length - 1]
  if (first.type !== 'periodStart') err(first, '先頭は periodStart であること')
  if (first.clock.game !== 'start') err(first, 'periodStart はゲームクロックを start すること')
  if (last.type !== 'periodEnd') err(last, '末尾は periodEnd であること')
  if (last.gameClockMs !== 0) err(last, `periodEnd の gameClockMs は 0（${last.gameClockMs}）`)

  // クロックの畳み込み: gameClockMs 再計算・ショットクロック切れ検出
  let running = false
  let gcMs = script.quarterMs
  let prevAt = events[0]?.atMs ?? 0
  let shotMs: number | null = null
  for (const e of events) {
    const delta = e.atMs - prevAt
    if (running) {
      gcMs -= delta
      if (shotMs !== null) {
        shotMs -= delta
        if (shotMs < 0) err(e, `ショットクロックが切れている（${-shotMs}ms 超過）`)
      }
    }
    if (gcMs < 0) err(e, `ゲームクロックが負（${gcMs}ms）`)
    if (e.gameClockMs !== gcMs) {
      err(e, `gameClockMs が ${e.gameClockMs}（clock指示から計算すると ${gcMs}）`)
    }
    if (e.clock.game === 'start') running = true
    if (e.clock.game === 'stop') running = false
    if (typeof e.clock.shot === 'number') shotMs = e.clock.shot * 1000
    else if (e.clock.shot === 'hide') shotMs = null
    prevAt = e.atMs
  }

  // SC期待と shot 指示の対応
  for (const e of events) {
    const sc = e.expect['sc-operator']
    if (!sc) continue
    const shot = e.clock.shot
    if (sc.action === 'reset24' && shot !== 24 && shot !== 'hide') {
      err(e, `SC期待 reset24 なのに clock.shot が ${shot}`)
    }
    if (sc.action === 'reset14' && shot !== 14) err(e, `SC期待 reset14 なのに clock.shot が ${shot}`)
    if (sc.action === 'keep' && shot !== 'none') err(e, `SC期待 keep なのに clock.shot が ${shot}`)
  }

  // スコアラー期待の不変条件（得点累計・ファウル枠・ペン色・APアロー・タイムアウト分）
  const pen = penColorForQuarter(script.quarter)
  const totals: Record<Team, number> = { A: 0, B: 0 }
  const marks: PlacedMark[] = []
  let arrow: Team | null = null
  for (const e of events) {
    if ((e.type === 'fieldGoal' || e.type === 'freeThrow') && e.points !== undefined && e.team) {
      totals[e.team] += e.points
    }
    if (e.type === 'fieldGoal') {
      if (e.points === undefined || !e.team || e.playerNo === undefined) {
        err(e, 'fieldGoal には points・team・playerNo が必要')
      } else if (script.ruleset === 'u12' && e.points !== 2) {
        err(e, `U12の fieldGoal は2点（${e.points}点になっている）`)
      }
    }
    if (e.type === 'freeThrow' && e.points !== undefined && e.points !== 1) {
      err(e, `freeThrow 成功は1点（${e.points}点になっている）`)
    }

    const ex = e.expect.scorer
    if (!ex) continue
    if (ex.kind === 'apArrow') {
      if (arrow === null) {
        if (e.team && ex.to === e.team) {
          err(e, `最初の矢印はコントロールを得たチームの相手方向（to: ${ex.to}）`)
        }
      } else {
        const flipped: Team = arrow === 'A' ? 'B' : 'A'
        if (ex.to !== flipped) err(e, `矢印の反転先が ${ex.to}（現在 ${arrow} なので ${flipped}）`)
      }
      arrow = ex.to
      continue
    }
    const m = ex.mark
    if (m.color !== pen) err(e, `ペンの色が ${m.color}（第${script.quarter}Qは ${pen}）`)
    if (m.cell.kind === 'score') {
      if (m.mark.symbol === 'closeQ' || m.mark.symbol === 'closeGame') {
        if (e.type !== 'periodEnd') err(e, '締めの記入は periodEnd に置くこと')
        if (m.cell.score !== totals[m.cell.team]) {
          err(e, `締めのセルが ${m.cell.score}点目（${m.cell.team}の累計は ${totals[m.cell.team]}）`)
        }
      } else {
        if (e.team !== m.cell.team) err(e, `得点セルのチームがイベントと不一致（${m.cell.team}）`)
        if (m.cell.score !== totals[m.cell.team]) {
          err(e, `得点セルが ${m.cell.score}点目（累計から計算すると ${totals[m.cell.team]}）`)
        }
        if (e.type === 'freeThrow' && m.mark.symbol !== 'ft') err(e, 'FTの記号は ft（●）')
        if (e.type === 'fieldGoal' && script.ruleset === 'u12' && m.mark.symbol !== 'fg') {
          err(e, `U12のFGの記号は fg（${m.mark.symbol} になっている）`)
        }
        if (m.mark.playerNo !== e.playerNo) {
          err(e, `記入の背番号 ${m.mark.playerNo} がイベントの ${e.playerNo} と不一致`)
        }
      }
    }
    if (m.cell.kind === 'foul') {
      if (e.team !== m.cell.team) err(e, `ファウルセルのチームがイベントと不一致（${m.cell.team}）`)
      if (e.playerNo !== undefined && m.cell.row !== String(e.playerNo)) {
        err(e, `ファウル行 ${m.cell.row} がイベントの背番号 ${e.playerNo} と不一致`)
      }
      const slot = nextFoulSlot(marks, m.cell.team, m.cell.row)
      if (m.cell.slot !== slot) {
        err(e, `ファウル枠が slot${m.cell.slot}（累積から導くと slot${slot}）`)
      }
    }
    if (m.cell.kind === 'timeout') {
      if (e.team !== m.cell.team) {
        err(e, `タイムアウトセルのチームがイベントと不一致（${m.cell.team}）`)
      }
      const min = timeoutMinute(script.quarterMs / 60000, Math.round(e.gameClockMs / 1000))
      if (m.mark.value !== min) err(e, `経過分が ${m.mark.value}（計算では ${min}）`)
    }
    marks.push(m)
  }

  return errors
}
