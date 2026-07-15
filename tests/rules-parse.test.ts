import { describe, expect, it } from 'vitest'
import {
  buildChapters,
  chapterGroup,
  normalizeForSearch,
  parseChapter,
  stripMarkdown,
} from '../src/features/rules/parse'

const SAMPLE = `# テスト章

last_updated: 2026-07-01
source: テストPDF（第1章）

イントロ本文。[[other]] を参照。

---

## セクションA

本文A。

| 項目 | 値 |
|------|----|
| ふりがな | ふ |

## セクションB

本文B。

# 大見出しC

本文C。
`

describe('parseChapter', () => {
  it('タイトル・メタデータ・セクションを抽出する', () => {
    const c = parseChapter('99-test.md', SAMPLE)
    expect(c.slug).toBe('99-test')
    expect(c.title).toBe('テスト章')
    expect(c.lastUpdated).toBe('2026-07-01')
    expect(c.sourceNote).toBe('テストPDF（第1章）')
    expect(c.sections.map((s) => s.heading)).toEqual([
      null,
      'セクションA',
      'セクションB',
      '大見出しC',
    ])
  })

  it('イントロの本文から区切り線とメタ行を除く', () => {
    const c = parseChapter('99-test.md', SAMPLE)
    expect(c.sections[0].bodyMd).toBe('イントロ本文。[[other]] を参照。')
  })

  it('見出しがないファイル（glossary型）は単一セクションになる', () => {
    const c = parseChapter('glossary.md', '# 用語集\n\n| 用語 | 意味 |\n|---|---|\n| AP | アロー |\n')
    expect(c.sections).toHaveLength(1)
    expect(c.sections[0].heading).toBeNull()
    expect(c.sections[0].bodyMd).toContain('| AP | アロー |')
  })

  it('コードフェンス内の見出し風の行では分割しない', () => {
    const raw = '# T\n\n## A\n\n```\n## not-a-heading\n```\n'
    const c = parseChapter('99-test.md', raw)
    expect(c.sections.map((s) => s.heading)).toEqual(['A'])
  })
})

describe('chapterGroup', () => {
  it('01〜06は審判、07〜10はTO、glossaryは用語集', () => {
    expect(chapterGroup('01-court-players')).toBe('referee')
    expect(chapterGroup('06-difficult-calls')).toBe('referee')
    expect(chapterGroup('07-to-basics')).toBe('to')
    expect(chapterGroup('10-to-difficult-cases')).toBe('to')
    expect(chapterGroup('glossary')).toBe('glossary')
  })
})

describe('buildChapters', () => {
  it('wikilinkを章タイトルつきのhashリンクに書き換える', () => {
    const { chapters, warnings } = buildChapters([
      { filename: '99-test.md', raw: SAMPLE },
      { filename: 'other.md', raw: '# 別の章\n\n本文。\n' },
    ])
    expect(warnings).toEqual([])
    const intro = chapters.find((c) => c.slug === '99-test')?.sections[0]
    expect(intro?.bodyMd).toContain('[別の章](#/rules/other)')
  })

  it('未解決のwikilinkは平文にしてwarningを返す', () => {
    const { chapters, warnings } = buildChapters([{ filename: '99-test.md', raw: SAMPLE }])
    expect(warnings).toEqual(['99-test: 未解決のwikilink [[other]]'])
    expect(chapters[0].sections[0].bodyMd).toContain('other を参照。')
  })

  it('数字順にソートしglossaryを最後に置く', () => {
    const { chapters } = buildChapters([
      { filename: 'glossary.md', raw: '# 用語集\n\nx\n' },
      { filename: '02-b.md', raw: '# B\n\nx\n' },
      { filename: '01-a.md', raw: '# A\n\nx\n' },
    ])
    expect(chapters.map((c) => c.slug)).toEqual(['01-a', '02-b', 'glossary'])
  })
})

describe('stripMarkdown', () => {
  it('テーブル・リンク・強調を平文化する', () => {
    const plain = stripMarkdown('**強調** [リンク](#/x) あり\n\n| A | B |\n|---|---|\n| 1 | 2 |')
    expect(plain).toBe('強調 リンク あり A B 1 2')
  })
})

describe('normalizeForSearch', () => {
  it('全半角・大文字小文字を吸収しつつ長さを保つ', () => {
    expect(normalizeForSearch('ＴＯマニュアル')).toBe('toマニュアル')
    expect(normalizeForSearch('Shot Clock 24')).toBe('shot clock 24')
    const src = '１４秒でリセット'
    expect(normalizeForSearch(src)).toHaveLength(src.length)
  })
})
