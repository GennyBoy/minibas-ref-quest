import { buildChapters } from './parse'
import type { RuleChapter } from './types'

// content/knowledge/*.md（scripts/sync-knowledge.ts でVaultから同期）を
// ビルド時にバンドルする。内容の検証は validate-content が担う。
const modules = import.meta.glob('../../../content/knowledge/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const files = Object.entries(modules).map(([path, raw]) => ({
  filename: path.split('/').pop() ?? path,
  raw,
}))

export const chapters: RuleChapter[] = buildChapters(files).chapters

export const chapterBySlug: ReadonlyMap<string, RuleChapter> = new Map(
  chapters.map((c) => [c.slug, c]),
)
