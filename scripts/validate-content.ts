import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { allQuestions, validateQuestions, TO_ROLES, ROLE_LABELS } from '../content'
import {
  shotClockCases,
  gameClockCases,
  sheetTasks,
  validateDrillContent,
  isDivergent,
} from '../content/drills'
import { gameScripts } from '../content/sim'
import { buildChapters } from '../src/features/rules/parse'
import { validateSheetTasks } from '../src/lib/scoresheet'
import { validateSimScript } from '../src/features/tosim/validate'

const errors = validateQuestions(allQuestions)
if (errors.length > 0) {
  console.error('コンテンツ検証エラー:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`OK: ${allQuestions.length}問すべて検証を通過`)

// ドリルケースの検証
const drillErrors = validateDrillContent({ shotClockCases, gameClockCases, sheetTasks })
drillErrors.push(...validateSheetTasks(sheetTasks))
if (shotClockCases.length < 30) {
  drillErrors.push(`shotclock: ケースが${shotClockCases.length}件（30件以上必要）`)
}
if (gameClockCases.length < 20) {
  drillErrors.push(`gameclock: ケースが${gameClockCases.length}件（20件以上必要）`)
}
if (sheetTasks.length < 20) {
  drillErrors.push(`sheet: お題が${sheetTasks.length}件（20件以上必要）`)
}
if (drillErrors.length > 0) {
  console.error('ドリル検証エラー:')
  for (const e of drillErrors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(
  `OK: ドリル shotclock ${shotClockCases.length}ケース（うちU12/一般で答えが分かれる ${shotClockCases.filter(isDivergent).length}ケース）`,
)
console.log(
  `OK: ドリル gameclock ${gameClockCases.length}ケース（うちU12/一般で答えが分かれる ${gameClockCases.filter(isDivergent).length}ケース）`,
)
console.log(`OK: ドリル sheet ${sheetTasks.length}お題（記入ルールの機械検証込み）`)

// シミュレーター台本の検証
const simErrors: string[] = []
for (const s of gameScripts) {
  simErrors.push(...validateSimScript(s).map((e) => `${s.id} ${e}`))
  if (s.events.length < 20 || s.events.length > 36) {
    simErrors.push(`${s.id}: イベント数が${s.events.length}（20〜36が目安）`)
  }
}
if (simErrors.length > 0) {
  console.error('シミュレーター台本検証エラー:')
  for (const e of simErrors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log(
  `OK: シミュレーター台本 ${gameScripts.length}本・計${gameScripts.reduce((n, s) => n + s.events.length, 0)}イベント（クロック整合・記入ルールの機械検証込み）`,
)

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
  const simEvents = gameScripts.flatMap((s) => s.events)
  for (const q of [...allQuestions, ...shotClockCases, ...gameClockCases, ...sheetTasks, ...simEvents]) {
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
