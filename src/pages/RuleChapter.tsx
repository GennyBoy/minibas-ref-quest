import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'wouter'
import { chapterBySlug } from '../features/rules/chapters'
import { renderSectionHtml } from '../features/rules/render'

export default function RuleChapter() {
  const { slug, section } = useParams<{ slug: string; section?: string }>()
  const [, navigate] = useLocation()
  const chapter = chapterBySlug.get(slug)

  useEffect(() => {
    if (chapter === undefined) return
    if (section !== undefined) {
      document.getElementById(section)?.scrollIntoView({ block: 'start' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [chapter, section])

  if (chapter === undefined) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>章が見つかりません</p>
        <Link href="/rules" className="mt-3 inline-block font-bold text-orange-600">
          ← ルール一覧へ
        </Link>
      </div>
    )
  }

  const toc = chapter.sections.filter((s) => s.heading !== null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/rules" className="text-sm font-bold text-orange-600 active:opacity-70">
          ← ルール一覧
        </Link>
        {chapter.lastUpdated !== undefined && (
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
            更新 {chapter.lastUpdated}
          </span>
        )}
      </div>

      <h1 className="text-lg font-black tracking-tight text-orange-800">{chapter.title}</h1>

      {toc.length > 1 && (
        <nav className="flex flex-wrap gap-1.5">
          {toc.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/rules/${chapter.slug}/${s.id}`)}
              className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 active:bg-orange-100"
            >
              {s.heading}
            </button>
          ))}
        </nav>
      )}

      <div className="space-y-3">
        {chapter.sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-4 rounded-2xl bg-white p-4 shadow-sm"
          >
            {s.heading !== null && (
              <h2 className="mb-2 border-b border-orange-100 pb-2 text-base font-bold text-orange-700">
                {s.heading}
              </h2>
            )}
            <div
              className="rules-md text-slate-700"
              dangerouslySetInnerHTML={{ __html: renderSectionHtml(s) }}
            />
          </section>
        ))}
      </div>

      {chapter.sourceNote !== undefined && (
        <p className="px-1 pb-2 text-[11px] leading-relaxed text-slate-400">
          出典: {chapter.sourceNote}
        </p>
      )}
    </div>
  )
}
