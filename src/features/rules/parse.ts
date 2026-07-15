import type { RuleChapter, RuleGroup, RuleSection } from './types'

// Vault の knowledge/*.md をパースする純粋関数群。
// アプリ本体（chapters.ts）だけでなく scripts/sync-knowledge.ts と
// scripts/validate-content.ts からも tsx 経由で使うため、Vite API には依存しない。

export interface RawChapterFile {
  filename: string
  raw: string
}

interface ParsedSection {
  heading: string | null
  lines: string[]
}

export function chapterGroup(slug: string): RuleGroup {
  if (slug === 'glossary') return 'glossary'
  const n = Number.parseInt(slug, 10)
  return Number.isFinite(n) && n <= 6 ? 'referee' : 'to'
}

function chapterSortKey(slug: string): number {
  if (slug === 'glossary') return Number.MAX_SAFE_INTEGER
  const n = Number.parseInt(slug, 10)
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER - 1
}

/** Markdown記法を取り除いて検索・スニペット用の平文にする */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^```[^\n]*$/gm, ' ')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ') // テーブルの区切り行
    .replace(/\|/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^-{3,}\s*$/gm, ' ')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 検索用の正規化（全半角ゆれ・大文字小文字を吸収）。
 * ハイライト位置を元テキストに対応づけるため、文字単位で正規化して
 * UTF-16長を必ず保存する（長さが変わる正規化はその文字だけ諦める）。
 */
export function normalizeForSearch(text: string): string {
  let out = ''
  for (const ch of text) {
    const n = ch.normalize('NFKC').toLowerCase()
    out += n.length === ch.length ? n : ch.toLowerCase()
  }
  return out
}

/** 本文中の [[slug]] をすべて列挙する */
export function extractWikilinks(md: string): string[] {
  return [...md.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim())
}

function trimSectionLines(lines: string[]): string[] {
  const out = [...lines]
  while (out.length > 0 && (out[0].trim() === '' || /^-{3,}$/.test(out[0].trim()))) out.shift()
  while (
    out.length > 0 &&
    (out[out.length - 1].trim() === '' || /^-{3,}$/.test(out[out.length - 1].trim()))
  )
    out.pop()
  return out
}

interface ParsedChapter {
  slug: string
  title: string
  lastUpdated?: string
  sourceNote?: string
  group: RuleGroup
  sections: { heading: string | null; bodyMd: string }[]
}

/**
 * 1ファイルをパースする。最初のH1をタイトル、以降のH1/H2をセクション見出しとして分割
 * （09-to-timer-shotclock.md は本文中に複数のH1を持つ）。
 * 見出しのないファイル（glossary.md）は単一セクションになる。
 */
export function parseChapter(filename: string, raw: string): ParsedChapter {
  const slug = filename.replace(/\.md$/, '')
  const lines = raw.split('\n')

  let title: string | null = null
  let lastUpdated: string | undefined
  let sourceNote: string | undefined
  const sections: ParsedSection[] = [{ heading: null, lines: [] }]
  let inFence = false

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence
      sections[sections.length - 1].lines.push(line)
      continue
    }
    if (!inFence) {
      const h = line.match(/^(#{1,2}) (.+)$/)
      if (h) {
        if (title === null && h[1] === '#') {
          title = h[2].trim()
          continue
        }
        sections.push({ heading: h[2].trim(), lines: [] })
        continue
      }
      // メタデータ行は最初の見出しより前（イントロ）にのみ現れる
      if (sections.length === 1) {
        const lu = line.match(/^last_updated:\s*(.+)$/)
        if (lu) {
          lastUpdated = lu[1].trim()
          continue
        }
        const src = line.match(/^source:\s*(.+)$/)
        if (src) {
          sourceNote = src[1].trim()
          continue
        }
      }
    }
    sections[sections.length - 1].lines.push(line)
  }

  const nonEmpty = sections
    .map((s) => ({ heading: s.heading, bodyMd: trimSectionLines(s.lines).join('\n') }))
    .filter((s) => s.heading !== null || s.bodyMd !== '')

  return {
    slug,
    title: title ?? slug,
    lastUpdated,
    sourceNote,
    group: chapterGroup(slug),
    sections: nonEmpty,
  }
}

export interface BuildResult {
  chapters: RuleChapter[]
  /** H1欠落・未解決wikilinkなどの問題（validate-content / sync で使う） */
  warnings: string[]
}

/**
 * 全ファイルをパースし、章間の [[slug]] を解決して完成形の RuleChapter[] を返す。
 * 未解決のwikilinkはリンク化せず平文にし、warningsに積む。
 */
export function buildChapters(files: RawChapterFile[]): BuildResult {
  const warnings: string[] = []
  const parsed = files
    .map((f) => {
      const p = parseChapter(f.filename, f.raw)
      if (!f.raw.split('\n').some((l) => /^# /.test(l))) {
        warnings.push(`${f.filename}: H1（タイトル）がありません`)
      }
      return p
    })
    .sort((a, b) => chapterSortKey(a.slug) - chapterSortKey(b.slug))

  const titleBySlug = new Map(parsed.map((p) => [p.slug, p.title]))

  const resolveLinks = (md: string, fromSlug: string): string =>
    md.replace(/\[\[([^\]]+)\]\]/g, (_, target: string) => {
      const t = target.trim()
      const title = titleBySlug.get(t)
      if (title === undefined) {
        warnings.push(`${fromSlug}: 未解決のwikilink [[${t}]]`)
        return t
      }
      // hashルーティングのため素の #/rules/... リンクで遷移できる
      return `[${title}](#/rules/${t})`
    })

  const chapters: RuleChapter[] = parsed.map((p) => ({
    slug: p.slug,
    title: p.title,
    lastUpdated: p.lastUpdated,
    sourceNote: p.sourceNote === undefined ? undefined : stripMarkdown(p.sourceNote),
    group: p.group,
    sections: p.sections.map((s, i): RuleSection => {
      const bodyMd = resolveLinks(s.bodyMd, p.slug)
      const plain = stripMarkdown(s.heading === null ? bodyMd : `${s.heading} ${bodyMd}`)
      return {
        id: `s${i}`,
        heading: s.heading,
        bodyMd,
        plain,
        norm: normalizeForSearch(plain),
      }
    }),
  }))

  return { chapters, warnings }
}
