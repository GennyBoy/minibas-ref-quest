export const RULE_GROUPS = ['referee', 'to', 'glossary'] as const
export type RuleGroup = (typeof RULE_GROUPS)[number]

export const RULE_GROUP_LABELS: Record<RuleGroup, string> = {
  referee: '審判ルール',
  to: 'TO（テーブルオフィシャルズ）',
  glossary: '用語集',
}

export interface RuleSection {
  /** 章内で安定なID（'s0', 's1', …）。見出しが日本語のためslug化はしない */
  id: string
  /** 最初の見出しより前のイントロ部分は null */
  heading: string | null
  /** wikilink解決済みのMarkdown本文 */
  bodyMd: string
  /** Markdown記法を除去した検索・スニペット用テキスト */
  plain: string
  /** plain を NFKC 正規化＋小文字化したもの（検索マッチ用） */
  norm: string
}

export interface RuleChapter {
  /** ファイル名から .md を除いたもの（例: '07-to-basics'） */
  slug: string
  /** H1のテキスト */
  title: string
  /** 'last_updated:' 行の値（平文行。YAMLフロントマターではない） */
  lastUpdated?: string
  /** 'source:' 行の値。章末に出典として表示する */
  sourceNote?: string
  group: RuleGroup
  sections: RuleSection[]
}
