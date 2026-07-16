import { describe, it, expect } from 'vitest'
import {
  shotClockCases,
  shotClockCaseSchema,
  validateDrillContent,
  isDivergent,
} from '../content/drills'

describe('shotclock cases', () => {
  it('全ケースがスキーマを通過し、IDが一意', () => {
    expect(validateDrillContent({ shotClockCases })).toEqual([])
    for (const c of shotClockCases) {
      expect(shotClockCaseSchema.safeParse(c).success).toBe(true)
    }
  })

  it('30ケース以上ある（Issue #3 受け入れ条件）', () => {
    expect(shotClockCases.length).toBeGreaterThanOrEqual(30)
  })

  it('U12と一般で答えが分かれるケースが8件以上（くらべるモードの弾）', () => {
    expect(shotClockCases.filter(isDivergent).length).toBeGreaterThanOrEqual(8)
  })

  // knowledge/09: U12で14秒リセットになるのは
  // 「リングに触れて攻撃側が再コントロール」「リングに挟まったJBSで攻撃側」の2場面だけ
  it('U12のreset14回答は許可された2場面のケースに限られる', () => {
    const U12_RESET14_ALLOWED = new Set(['sc-015', 'sc-016', 'sc-017', 'sc-018'])
    for (const c of shotClockCases) {
      if (c.answer.u12 === 'reset14') {
        expect(U12_RESET14_ALLOWED.has(c.id), `${c.id} がU12でreset14`).toBe(true)
      }
    }
  })

  // U12にはフロントコート概念がないため「13秒以下で14リセット」もない
  it('一般がreset14でU12がreset24/keepの相違ケースの説明にU12側の理由が書かれている', () => {
    for (const c of shotClockCases.filter(isDivergent)) {
      expect(c.explanation).toMatch(/U12/)
    }
  })

  it('4アクションすべてが最低2ケースずつ出題される', () => {
    for (const action of ['reset24', 'reset14', 'keep', 'stopOnly'] as const) {
      const n = shotClockCases.filter(
        (c) => c.answer.u12 === action || c.answer.general === action,
      ).length
      expect(n, action).toBeGreaterThanOrEqual(2)
    }
  })
})
