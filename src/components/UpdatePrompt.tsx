import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-800 p-4 text-white shadow-lg">
      <span className="text-sm">新しいバージョンがあります</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold"
      >
        更新
      </button>
    </div>
  )
}
