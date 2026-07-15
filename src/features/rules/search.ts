import { normalizeForSearch } from './parse'
import type { RuleChapter, RuleSection } from './types'

const SNIPPET_RADIUS = 40

export interface SearchHit {
  chapter: RuleChapter
  section: RuleSection
  /** 最初のヒット位置±40文字の平文スニペット */
  snippet: string
  /** 正規化済みの検索語（ハイライト用） */
  terms: string[]
}

/** 空白区切りの全語が章タイトルまたはセクション本文に含まれるものを返す（AND部分一致） */
export function searchRules(chapters: RuleChapter[], query: string, limit = 50): SearchHit[] {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const hits: SearchHit[] = []
  for (const chapter of chapters) {
    const titleNorm = normalizeForSearch(chapter.title)
    for (const section of chapter.sections) {
      const ok = terms.every((t) => section.norm.includes(t) || titleNorm.includes(t))
      if (!ok) continue

      const firstIdx = terms
        .map((t) => section.norm.indexOf(t))
        .filter((i) => i >= 0)
        .reduce((min, i) => Math.min(min, i), Number.MAX_SAFE_INTEGER)
      const center = firstIdx === Number.MAX_SAFE_INTEGER ? 0 : firstIdx
      const start = Math.max(0, center - SNIPPET_RADIUS)
      const end = Math.min(section.plain.length, center + SNIPPET_RADIUS * 2)
      const snippet =
        (start > 0 ? '…' : '') +
        section.plain.slice(start, end) +
        (end < section.plain.length ? '…' : '')

      hits.push({ chapter, section, snippet, terms })
      if (hits.length >= limit) return hits
    }
  }
  return hits
}

export interface HighlightSegment {
  text: string
  hit: boolean
}

/** テキストを検索語のヒット区間で分割する（<mark>描画用） */
export function highlightSegments(text: string, terms: string[]): HighlightSegment[] {
  const norm = normalizeForSearch(text)
  const ranges: [number, number][] = []
  for (const t of terms) {
    if (t === '') continue
    let i = norm.indexOf(t)
    while (i !== -1) {
      ranges.push([i, i + t.length])
      i = norm.indexOf(t, i + 1) // 重なり合う出現もマージ対象にする
    }
  }
  if (ranges.length === 0) return [{ text, hit: false }]

  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [ranges[0]]
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1]
    if (s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }

  const segments: HighlightSegment[] = []
  let pos = 0
  for (const [s, e] of merged) {
    if (s > pos) segments.push({ text: text.slice(pos, s), hit: false })
    segments.push({ text: text.slice(s, e), hit: true })
    pos = e
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), hit: false })
  return segments
}
