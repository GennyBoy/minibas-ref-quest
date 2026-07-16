import { useRef, useState } from 'react'
import { useProgress } from '../stores/progress'
import { useSettings } from '../stores/settings'

export default function Settings() {
  const { xp, srs, sessions, drillBest, importState, reset } = useProgress()
  const { ruleset, questionsPerSession, setRuleset, setQuestionsPerSession } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function exportData() {
    const data = JSON.stringify({
      app: 'minibas-ref-quest',
      version: 2,
      xp,
      srs,
      sessions,
      drillBest,
    })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `to-quest-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('バックアップをダウンロードしました')
  }

  async function importData(file: File) {
    try {
      const data = JSON.parse(await file.text())
      if (data.app !== 'minibas-ref-quest') throw new Error('形式が違います')
      importState(data)
      setMessage('進捗を読み込みました')
    } catch {
      setMessage('読み込みに失敗しました（ファイル形式を確認してください）')
    }
  }

  function resetAll() {
    if (confirm('学習の進捗（XP・習熟度・復習スケジュール）をすべて消します。よろしいですか？')) {
      reset()
      setMessage('進捗をリセットしました')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-center text-lg font-black text-orange-700">⚙️ 設定</h1>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-600">出題するルール</h2>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['u12', 'U12（ミニバス）'],
              ['general', '一般（5人制）'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRuleset(value)}
              className={`min-h-12 rounded-xl p-3 text-sm font-bold ${
                ruleset === value ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          共通ルールの問題はどちらのモードでも出題されます
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-600">1セッションの問題数</h2>
        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 15].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuestionsPerSession(n)}
              className={`min-h-12 rounded-xl p-3 text-sm font-bold ${
                questionsPerSession === n ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {n}問
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-600">進捗のバックアップ</h2>
        <p className="mb-3 text-[11px] text-slate-400">
          進捗はこの端末のブラウザにのみ保存されます。長期間使わないとブラウザが消すことがあるため、ときどきバックアップしてください。
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportData}
            className="min-h-12 rounded-xl bg-slate-800 p-3 text-sm font-bold text-white"
          >
            エクスポート
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-12 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-600"
          >
            インポート
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
        {message && <p className="mt-2 text-center text-xs font-bold text-orange-600">{message}</p>}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <button type="button" onClick={resetAll} className="w-full text-sm font-bold text-rose-500">
          進捗をすべてリセットする
        </button>
      </section>

      <section className="rounded-2xl bg-white p-4 text-[11px] leading-relaxed text-slate-400 shadow-sm">
        <p className="mb-1 font-bold text-slate-500">このアプリについて</p>
        <p>
          ミニバスケットボール（U12）のTO・審判ルールを学ぶための非公式の個人制作学習アプリです。JBA・FIBAとは関係ありません。問題・解説は制作者自身のまとめにもとづくもので、正確性を保証するものではありません。実際の大会では必ず最新の競技規則・大会要項・主催者の指示に従ってください（2026年競技規則ベース）。
        </p>
      </section>
    </div>
  )
}
