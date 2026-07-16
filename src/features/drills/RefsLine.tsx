import { Link } from 'wouter'
import { chapterBySlug } from '../rules/chapters'

/** フィードバック内の「根拠: 📖 章タイトル」リンク行（Quizと同じ作法） */
export default function RefsLine({ refs }: { refs: string[] }) {
  return (
    <p className="text-[11px] text-slate-400">
      根拠:{' '}
      {refs.map((ref, i) => {
        const slug = ref.match(/^knowledge\/(.+)$/)?.[1]
        const chapter = slug ? chapterBySlug.get(slug) : undefined
        return (
          <span key={ref}>
            {i > 0 && '、'}
            {chapter ? (
              <Link
                href={`/rules/${chapter.slug}`}
                className="font-bold text-orange-600 underline underline-offset-2"
              >
                📖 {chapter.title}
              </Link>
            ) : (
              ref
            )}
          </span>
        )
      })}
    </p>
  )
}
