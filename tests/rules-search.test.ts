import { describe, expect, it } from 'vitest'
import { buildChapters } from '../src/features/rules/parse'
import { highlightSegments, searchRules } from '../src/features/rules/search'

const { chapters } = buildChapters([
  {
    filename: '01-a.md',
    raw: '# ショットクロックの章\n\n## リセット\n\nフロントコートで14秒にリセットする。\n\n## その他\n\n関係ない本文。\n',
  },
  {
    filename: '02-b.md',
    raw: '# 別の章\n\n## タイムアウト\n\n請求はスコアラーに伝える。\n',
  },
])

describe('searchRules', () => {
  it('本文の部分一致でセクション単位のヒットを返す', () => {
    const hits = searchRules(chapters, '14秒')
    expect(hits).toHaveLength(1)
    expect(hits[0].chapter.slug).toBe('01-a')
    expect(hits[0].section.heading).toBe('リセット')
    expect(hits[0].snippet).toContain('14秒にリセット')
  })

  it('全半角・大文字小文字のゆれを吸収する', () => {
    expect(searchRules(chapters, '１４秒')).toHaveLength(1)
    expect(searchRules(chapters, 'タイムアウト')).toHaveLength(1)
  })

  it('複数語はAND条件（章タイトルとの組み合わせも可）', () => {
    expect(searchRules(chapters, 'ショットクロック リセット')).toHaveLength(1)
    expect(searchRules(chapters, 'リセット スコアラー')).toHaveLength(0)
  })

  it('空クエリは空結果', () => {
    expect(searchRules(chapters, '')).toEqual([])
    expect(searchRules(chapters, '  ')).toEqual([])
  })
})

describe('highlightSegments', () => {
  it('ヒット区間を分割して返す', () => {
    const segs = highlightSegments('フロントコートで14秒にリセット', ['14秒'])
    expect(segs).toEqual([
      { text: 'フロントコートで', hit: false },
      { text: '14秒', hit: true },
      { text: 'にリセット', hit: false },
    ])
  })

  it('正規化ゆれ（全角クエリ→半角本文）でも位置がずれない', () => {
    const segs = highlightSegments('残り14秒', ['１４秒'.normalize('NFKC').toLowerCase()])
    expect(segs).toEqual([
      { text: '残り', hit: false },
      { text: '14秒', hit: true },
    ])
  })

  it('重複・隣接する区間はマージする', () => {
    const segs = highlightSegments('ababa', ['aba', 'bab'])
    expect(segs).toEqual([{ text: 'ababa', hit: true }])
  })

  it('ヒットなしは1区間', () => {
    expect(highlightSegments('本文', ['zzz'])).toEqual([{ text: '本文', hit: false }])
  })
})
