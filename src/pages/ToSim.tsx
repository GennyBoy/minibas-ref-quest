import { useState } from 'react'
import { Link, useParams } from 'wouter'
import { ROLE_LABELS, TO_ROLES, type ToRole } from '../../content'
import { q1U12Script } from '../../content/sim'
import SimShell from '../features/tosim/SimShell'
import { simPluginForRole } from '../features/tosim/roles/registry'

export default function ToSim() {
  const params = useParams<{ role: string }>()
  const role = TO_ROLES.find((r) => r === params.role) as ToRole | undefined
  const [nonce, setNonce] = useState(0)

  if (!role) {
    return <p className="py-20 text-center text-slate-500">この役割は存在しません</p>
  }
  const plugin = simPluginForRole(role)
  if (!plugin) {
    return (
      <div className="space-y-4">
        <Link href={`/to/${role}`} className="inline-block text-sm text-slate-500">
          ← {ROLE_LABELS[role]}ハブ
        </Link>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <p className="font-bold text-slate-400">🎬 {ROLE_LABELS[role]}のシミュレーター</p>
          <p className="mt-1 text-xs text-slate-400">近日公開</p>
        </div>
      </div>
    )
  }
  return (
    <SimShell
      key={nonce}
      script={q1U12Script}
      plugin={plugin}
      onRetry={() => setNonce((n) => n + 1)}
    />
  )
}
