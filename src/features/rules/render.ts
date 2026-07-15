import { marked } from 'marked'
import type { RuleSection } from './types'

marked.use({ gfm: true, breaks: false, async: false })

const cache = new Map<string, string>()

/** セクション本文をHTMLへ変換（自作コンテンツのためサニタイズはしない） */
export function renderSectionHtml(section: RuleSection): string {
  const cached = cache.get(section.bodyMd)
  if (cached !== undefined) return cached
  const html = marked.parse(section.bodyMd) as string
  cache.set(section.bodyMd, html)
  return html
}
