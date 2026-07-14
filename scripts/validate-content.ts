import { allQuestions, validateQuestions, TO_ROLES, ROLE_LABELS } from '../content'

const errors = validateQuestions(allQuestions)
if (errors.length > 0) {
  console.error('コンテンツ検証エラー:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`OK: ${allQuestions.length}問すべて検証を通過`)
for (const role of TO_ROLES) {
  const n = allQuestions.filter((q) => q.roles?.includes(role)).length
  const status = n >= 10 ? 'OK' : '要追加'
  console.log(`  ${ROLE_LABELS[role]}: ${n}問 (${status})`)
  if (n < 10) process.exitCode = 1
}
