import type { SheetCategory, SheetSymbol } from '../../../content/drills/types'

/**
 * 記号パレット。出題カテゴリとルールセットに応じて選択肢を出し分ける。
 * timeout カテゴリは記号ではなく「経過分」の数字を選ぶ。
 */

export interface PaletteValue {
  symbol: SheetSymbol | null
  subscript: number | null
  value: number | null
}

const SCORE_SYMBOLS: { symbol: SheetSymbol; glyph: string; label: string; u12Only?: boolean; generalOnly?: boolean }[] = [
  { symbol: 'ft', glyph: '●', label: 'FT 1点' },
  { symbol: 'fg', glyph: '／', label: 'FG 2点' },
  { symbol: 'fg3', glyph: '／⑦', label: '3点', generalOnly: true },
  { symbol: 'ownGoal', glyph: '▲', label: 'オウンゴール', u12Only: true },
]

const FOUL_SYMBOLS: { symbol: SheetSymbol; label: string; u12Only?: boolean }[] = [
  { symbol: 'P', label: 'パーソナル' },
  { symbol: 'T', label: 'テクニカル' },
  { symbol: 'U', label: 'アンスポ' },
  { symbol: 'C', label: 'HC自身' },
  { symbol: 'B', label: 'ベンチ' },
  { symbol: 'M', label: 'マンツー', u12Only: true },
]

const CLOSING_SYMBOLS: { symbol: SheetSymbol; glyph: string; label: string }[] = [
  { symbol: 'closeQ', glyph: '◯＋太線1本', label: 'Q終了の締め' },
  { symbol: 'closeGame', glyph: '◯＋太線2本', label: 'ゲーム終了の締め' },
]

/** ファウル欄・タイムアウト欄の締め線（前半終了・ゲーム終了の記帳） */
const SEAL_SYMBOLS: { symbol: SheetSymbol; glyph: string; label: string }[] = [
  { symbol: 'closeFoulsHalf', glyph: '｜', label: '仕切り線（前半終了）' },
  { symbol: 'closeUnused', glyph: '＝', label: '未使用枠の締め' },
]

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl px-2 py-1.5 text-center shadow-sm active:scale-[0.97] ${
        active ? 'bg-orange-500 text-white' : 'bg-white text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function SymbolPalette({
  category,
  ruleset,
  value,
  onChange,
}: {
  category: SheetCategory
  ruleset: 'u12' | 'general'
  value: PaletteValue
  onChange: (v: PaletteValue) => void
}) {
  if (category === 'timeout') {
    return (
      <div className="space-y-2">
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">経過時間（分）を選ぶ</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <OptionButton
                key={n}
                active={value.symbol === 'timeout' && value.value === n}
                onClick={() => onChange({ symbol: 'timeout', subscript: null, value: n })}
              >
                <span className="text-lg font-black">{n}</span>
              </OptionButton>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-slate-500">またはゲーム終了の締め</p>
          <div className="grid grid-cols-2 gap-1.5">
            <OptionButton
              active={value.symbol === 'closeUnused'}
              onClick={() => onChange({ symbol: 'closeUnused', subscript: null, value: null })}
            >
              <span className="block text-lg font-black leading-none">＝</span>
              <span className="text-[10px] font-bold">未使用枠の締め</span>
            </OptionButton>
          </div>
        </div>
      </div>
    )
  }

  if (category === 'score') {
    const options = SCORE_SYMBOLS.filter(
      (o) => !(o.u12Only && ruleset === 'general') && !(o.generalOnly && ruleset === 'u12'),
    )
    return (
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">記号を選ぶ</p>
        <div className="grid grid-cols-3 gap-1.5">
          {options.map((o) => (
            <OptionButton
              key={o.symbol}
              active={value.symbol === o.symbol}
              onClick={() => onChange({ symbol: o.symbol, subscript: null, value: null })}
            >
              <span className="block text-lg font-black leading-none">{o.glyph}</span>
              <span className="text-[10px] font-bold">{o.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    )
  }

  if (category === 'closing') {
    return (
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">締め方を選ぶ</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CLOSING_SYMBOLS.map((o) => (
            <OptionButton
              key={o.symbol}
              active={value.symbol === o.symbol}
              onClick={() => onChange({ symbol: o.symbol, subscript: null, value: null })}
            >
              <span className="block text-sm font-black leading-tight">{o.glyph}</span>
              <span className="text-[10px] font-bold">{o.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    )
  }

  // foul
  const fouls = FOUL_SYMBOLS.filter((o) => !(o.u12Only && ruleset === 'general'))
  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">ファウル記号を選ぶ</p>
        <div className="grid grid-cols-6 gap-1.5">
          {fouls.map((o) => (
            <OptionButton
              key={o.symbol}
              active={value.symbol === o.symbol}
              onClick={() => onChange({ ...value, symbol: o.symbol, value: null })}
            >
              <span className="block text-lg font-black leading-none">{o.symbol}</span>
              <span className="text-[9px]">{o.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">FT本数（右下の添え字）</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[null, 1, 2, 3].map((n) => (
            <OptionButton
              key={String(n)}
              active={value.subscript === n}
              onClick={() => onChange({ ...value, subscript: n, value: null })}
            >
              <span className="text-sm font-black">{n === null ? 'なし' : `${n}本`}</span>
            </OptionButton>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500">または締め線（前半・ゲーム終了）</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SEAL_SYMBOLS.map((o) => (
            <OptionButton
              key={o.symbol}
              active={value.symbol === o.symbol}
              onClick={() => onChange({ symbol: o.symbol, subscript: null, value: null })}
            >
              <span className="block text-lg font-black leading-none">{o.glyph}</span>
              <span className="text-[10px] font-bold">{o.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}
