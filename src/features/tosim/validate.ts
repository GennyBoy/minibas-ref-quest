import type { PlacedMark, Team } from '../../../content/drills/types'
import type { GameScript, SimEvent } from '../../../content/sim/types'
import { gameScriptSchema } from '../../../content/sim/types'
import { nextFoulSlot, penColorForQuarter, timeoutMinute } from '../../lib/scoresheet'
import { foldShotClock, quarterIndex } from './steps'

/**
 * GameScript の整合性検証（スキーマより強い、ルール・クロック由来の不変条件）。
 * validate-content スクリプトとテストの両方から使う。
 * ゲームクロックの差分からショットクロックを畳み込み再現して SC切れを検出し、
 * 記入ルール（累計・ファウル枠・ペン色・アロー・タイムアウト分）を機械検証する。
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

  // ID重複
  const seen = new Set<string>()
  for (const e of events) {
    if (seen.has(e.id)) err(e, 'ID重複')
    seen.add(e.id)
  }

  // 構造: 各Qは periodStart(残り=quarterMs)〜periodEnd(残り=0) で閉じ、Qは昇順に進む
  let curQ: SimEvent['quarter'] | null = null
  let lastClosedQIdx = -1
  let prevGc = 0
  for (const e of events) {
    if (e.type === 'periodStart') {
      if (curQ !== null) err(e, `前のQ（第${curQ}Q）が periodEnd で閉じていない`)
      if (quarterIndex(e.quarter) <= lastClosedQIdx) {
        err(e, `クォーターの順序が逆行している（第${e.quarter}Q）`)
      }
      if (e.gameClockMs !== script.quarterMs) {
        err(e, `periodStart の gameClockMs は quarterMs（${e.gameClockMs}）`)
      }
      curQ = e.quarter
      prevGc = script.quarterMs
      continue
    }
    if (curQ === null) {
      err(e, 'periodStart の前にイベントがある')
      continue
    }
    if (e.quarter !== curQ) err(e, `quarter が ${e.quarter}（現在は第${curQ}Q）`)
    if (e.gameClockMs > prevGc) {
      err(e, `ゲームクロックが増えている（${prevGc} → ${e.gameClockMs}）`)
    }
    prevGc = e.gameClockMs
    if (e.type === 'periodEnd') {
      if (e.gameClockMs !== 0) err(e, `periodEnd の gameClockMs は 0（${e.gameClockMs}）`)
      lastClosedQIdx = quarterIndex(curQ)
      curQ = null
    }
  }
  if (events[0]?.type !== 'periodStart') errors.push(`${script.id}: 先頭は periodStart であること`)
  if (events.length > 0 && events[events.length - 1].type !== 'periodEnd') {
    errors.push(`${script.id}: 末尾は periodEnd であること`)
  }

  // ショットクロック切れの検出
  const shotBefore = foldShotClock(events, script.quarterMs)
  events.forEach((e, i) => {
    const s = shotBefore[i]
    if (s !== null && s < 0) err(e, `ショットクロックが切れている（${-s}ms 超過）`)
  })

  // SC期待と shot 指示の対応
  for (const e of events) {
    const sc = e.expect['sc-operator']
    if (!sc) continue
    if (sc.action === 'reset24' && e.shot !== 24 && e.shot !== 'hide') {
      err(e, `SC期待 reset24 なのに shot が ${e.shot}`)
    }
    if (sc.action === 'reset14' && e.shot !== 14) err(e, `SC期待 reset14 なのに shot が ${e.shot}`)
    if (sc.action === 'keep' && e.shot !== 'none') err(e, `SC期待 keep なのに shot が ${e.shot}`)
  }

  // スコアラー期待の不変条件（得点累計・ファウル枠・ペン色・APアロー・タイムアウト分は4Q通しで累積）
  const totals: Record<Team, number> = { A: 0, B: 0 }
  const marks: PlacedMark[] = []
  let arrow: Team | null = null
  const lastEvent = events[events.length - 1]
  for (const e of events) {
    if ((e.type === 'fieldGoal' || e.type === 'freeThrow') && e.points !== undefined && e.team) {
      totals[e.team] += e.points
    }
    if (e.type === 'fieldGoal') {
      if (e.points === undefined || !e.team) {
        err(e, 'fieldGoal には points・team が必要')
      } else if (script.ruleset === 'u12' && e.points !== 2) {
        err(e, `U12の fieldGoal は2点（${e.points}点になっている）`)
      }
    }
    if (e.type === 'play') {
      if (e.shot === 'none') err(e, 'play（経過）イベントは shot を再セットすること')
      if (e.expect['sc-operator'] || e.expect.scorer) err(e, 'play イベントに期待は置けない')
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
    const pen = penColorForQuarter(e.quarter)
    if (m.color !== pen) err(e, `ペンの色が ${m.color}（第${e.quarter}Qは ${pen}）`)
    if (m.cell.kind === 'score') {
      if (m.mark.symbol === 'closeQ' || m.mark.symbol === 'closeGame') {
        if (e.type !== 'periodEnd') err(e, '締めの記入は periodEnd に置くこと')
        if (m.mark.symbol === 'closeGame' && e !== lastEvent) {
          err(e, 'closeGame は最終イベントにだけ置くこと')
        }
        if (m.cell.score !== totals[m.cell.team]) {
          err(e, `締めのセルが ${m.cell.score}点目（${m.cell.team}の累計は ${totals[m.cell.team]}）`)
        }
      } else {
        if (e.team !== m.cell.team) err(e, `得点セルのチームがイベントと不一致（${m.cell.team}）`)
        if (m.cell.score !== totals[m.cell.team]) {
          err(e, `得点セルが ${m.cell.score}点目（累計から計算すると ${totals[m.cell.team]}）`)
        }
        if (e.type === 'freeThrow' && m.mark.symbol !== 'ft') err(e, 'FTの記号は ft（●）')
        if (
          e.type === 'fieldGoal' &&
          script.ruleset === 'u12' &&
          m.mark.symbol !== 'fg' &&
          m.mark.symbol !== 'ownGoal'
        ) {
          err(e, `U12のFGの記号は fg か ownGoal（${m.mark.symbol} になっている）`)
        }
        if (m.mark.symbol !== 'ownGoal' && m.mark.playerNo !== e.playerNo) {
          err(e, `記入の背番号 ${m.mark.playerNo} がイベントの ${e.playerNo} と不一致`)
        }
      }
    }
    if (m.cell.kind === 'foul') {
      if (e.team !== m.cell.team) err(e, `ファウルセルのチームがイベントと不一致（${m.cell.team}）`)
      if (m.cell.row !== 'HC' && e.playerNo !== undefined && m.cell.row !== String(e.playerNo)) {
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
