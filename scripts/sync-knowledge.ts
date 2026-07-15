import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { buildChapters } from '../src/features/rules/parse'

// Obsidian Vault の knowledge/*.md を content/knowledge/ へミラーコピーする。
// CIはVaultにアクセスできないため、同期結果はコミットして使う。

const DEFAULT_VAULT_DIR =
  '/Users/genkudo/Library/Mobile Documents/iCloud~md~obsidian/Documents/basketball-referee/knowledge'
const VAULT_DIR = process.env.VAULT_DIR ?? DEFAULT_VAULT_DIR
const DEST_DIR = join(import.meta.dirname, '..', 'content', 'knowledge')

// 個人ダッシュボードはルールコンテンツではないので同期しない
const EXCLUDE = new Set(['00-overview.md'])

if (!existsSync(VAULT_DIR)) {
  console.error(`Vaultが見つかりません: ${VAULT_DIR}（VAULT_DIR 環境変数で上書き可）`)
  process.exit(1)
}
mkdirSync(DEST_DIR, { recursive: true })

const srcFiles = readdirSync(VAULT_DIR)
  .filter((f) => f.endsWith('.md') && !EXCLUDE.has(f))
  .sort()

let added = 0
let updated = 0
let unchanged = 0
for (const f of srcFiles) {
  const destPath = join(DEST_DIR, f)
  const srcRaw = readFileSync(join(VAULT_DIR, f), 'utf8')
  if (!existsSync(destPath)) {
    added++
  } else if (readFileSync(destPath, 'utf8') !== srcRaw) {
    updated++
  } else {
    unchanged++
    continue
  }
  copyFileSync(join(VAULT_DIR, f), destPath)
}

let removed = 0
for (const f of readdirSync(DEST_DIR).filter((f) => f.endsWith('.md'))) {
  if (!srcFiles.includes(f)) {
    rmSync(join(DEST_DIR, f))
    removed++
  }
}

console.log(
  `同期完了: 追加 ${added} / 更新 ${updated} / 変更なし ${unchanged} / 削除 ${removed}（除外: ${[...EXCLUDE].join(', ')}）`,
)

// スモークチェック: 壊れたコンテンツをコミットしないようここで検知する
const { chapters, warnings } = buildChapters(
  srcFiles.map((f) => ({ filename: f, raw: readFileSync(join(DEST_DIR, f), 'utf8') })),
)
if (warnings.length > 0) {
  console.error('コンテンツに問題があります:')
  for (const w of warnings) console.error(`  - ${w}`)
  process.exit(1)
}
console.log(`OK: ${chapters.length}章（${chapters.reduce((n, c) => n + c.sections.length, 0)}セクション）を検証`)
