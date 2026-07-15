import { useState } from 'react'
import { Link } from 'wouter'
import { chapters } from '../features/rules/chapters'
import { RULE_GROUPS, RULE_GROUP_LABELS } from '../features/rules/types'
import { searchRules, highlightSegments } from '../features/rules/search'

const GROUP_ICONS: Record<string, string> = {
  referee: '🧑‍⚖️',
  to: '📋',
  glossary: '📖',
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightSegments(text, terms).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="rounded-sm bg-amber-200 px-0.5 font-bold text-slate-900">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export default function Rules() {
  const [query, setQuery] = useState('')
  const searching = query.trim() !== ''
  const hits = searching ? searchRules(chapters, query) : []

  return (
    <div className="space-y-4">
      <header className="pt-2 text-center">
        <h1 className="text-xl font-black tracking-tight text-orange-700">📖 ルールを調べる</h1>
        <p className="mt-1 text-xs text-slate-500">章を選んで読むか、キーワードで検索</p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 例: ショットクロック 14秒"
        className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-orange-400"
      />

      {searching ? (
        <section className="space-y-2.5">
          <h2 className="px-1 text-sm font-bold text-slate-600">
            検索結果 {hits.length}件{hits.length >= 50 && '（上位50件）'}
          </h2>
          {hits.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">
              見つかりませんでした。別のキーワードを試してください
            </p>
          )}
          {hits.map(({ chapter, section, snippet, terms }) => (
            <Link
              key={`${chapter.slug}/${section.id}`}
              href={`/rules/${chapter.slug}/${section.id}`}
              className="block rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99]"
            >
              <p className="text-[11px] font-bold text-orange-600">
                {chapter.title}
                {section.heading !== null && (
                  <span className="text-slate-400"> › {section.heading}</span>
                )}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                <Highlighted text={snippet} terms={terms} />
              </p>
            </Link>
          ))}
        </section>
      ) : (
        RULE_GROUPS.map((group) => {
          const groupChapters = chapters.filter((c) => c.group === group)
          if (groupChapters.length === 0) return null
          return (
            <section key={group}>
              <h2 className="mb-2 px-1 text-sm font-bold text-slate-600">
                {GROUP_ICONS[group]} {RULE_GROUP_LABELS[group]}
              </h2>
              <div className="space-y-2.5">
                {groupChapters.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/rules/${c.slug}`}
                    className="block rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 font-bold">{c.title}</span>
                      <span className="text-xs text-slate-400">
                        {c.sections.filter((s) => s.heading !== null).length || 1}項目
                      </span>
                    </div>
                    {c.lastUpdated !== undefined && (
                      <p className="mt-1 text-[11px] text-slate-400">更新: {c.lastUpdated}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
