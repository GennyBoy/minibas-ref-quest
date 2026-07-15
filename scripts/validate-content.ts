import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { allQuestions, validateQuestions, TO_ROLES, ROLE_LABELS } from '../content'
import { buildChapters } from '../src/features/rules/parse'

const errors = validateQuestions(allQuestions)
if (errors.length > 0) {
  console.error('コンテンツ検証エラー:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`OK: ${allQuestions.length}問すべて検証を通過`)

// ナレッジ（ルール閲覧コンテンツ）の検証
const knowledgeDir = join(import.meta.dirname, '..', 'content', 'knowledge')
const knowledgeErrors: string[] = []
if (!existsSync(knowledgeDir)) {
  knowledgeErrors.push(
    'content/knowledge/ がありません（npm run sync-knowledge を実行してください）',
  )
} else {
  const files = readdirSync(knowledgeDir).filter((f) => f.endsWith('.md'))
  const { chapters, warnings } = buildChapters(
    files.map((f) => ({ filename: f, raw: readFileSync(join(knowledgeDir, f), 'utf8') })),
  )
  knowledgeErrors.push(...warnings)

  const slugs = new Set(chapters.map((c) => c.slug))
  for (const q of allQuestions) {
    for (const ref of q.refs) {
      const slug = ref.match(/^knowledge\/(.+)$/)?.[1]
      if (slug !== undefined && !slugs.has(slug)) {
        knowledgeErrors.push(`${q.id}: refs の '${ref}' に対応する章がありません`)
      }
    }
  }
  if (knowledgeErrors.length === 0) {
    console.log(`OK: ナレッジ${chapters.length}章を検証（wikilink・refs整合）`)
  }
}
if (knowledgeErrors.length > 0) {
  console.error('ナレッジ検証エラー:')
  for (const e of knowledgeErrors) console.error(`  - ${e}`)
  process.exit(1)
}
for (const role of TO_ROLES) {
  const n = allQuestions.filter((q) => q.roles?.includes(role)).length
  const status = n >= 10 ? 'OK' : '要追加'
  console.log(`  ${ROLE_LABELS[role]}: ${n}問 (${status})`)
  if (n < 10) process.exitCode = 1
}
