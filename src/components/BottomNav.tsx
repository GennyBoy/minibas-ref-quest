import { Link, useLocation } from 'wouter'

const items = [
  { href: '/', label: 'ホーム', icon: '🏀' },
  { href: '/rules', label: 'ルール', icon: '📖' },
  { href: '/progress', label: '進捗', icon: '📈' },
  { href: '/settings', label: '設定', icon: '⚙️' },
]

export default function BottomNav() {
  const [location] = useLocation()
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-orange-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active =
            item.href === '/' ? location === '/' : location.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
                active ? 'font-bold text-orange-600' : 'text-slate-500'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
