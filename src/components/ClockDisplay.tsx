/**
 * 実機スコアボード風の7セグメント表示。
 * ゲームクロック（amber）とショットクロック（red）を dark パネルに描画する。
 * 表示内容は文字列で受け取る純表示コンポーネント（計時は useClock 側）。
 */

// 7セグメントの配置: a=上 b=右上 c=右下 d=下 e=左下 f=左上 g=中央
const SEG_POINTS: Record<string, string> = {
  a: '10,4 46,4 40,12 16,12',
  b: '52,10 52,46 44,40 44,16',
  c: '52,54 52,90 44,84 44,60',
  d: '10,96 46,96 40,88 16,88',
  e: '4,54 12,60 12,84 4,90',
  f: '4,10 12,16 12,40 4,46',
  g: '10,50 16,44 40,44 46,50 40,56 16,56',
}

const DIGIT_SEGS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgcde',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  ' ': '', // 全消灯（非表示状態）
}

function SevenSegDigit({ char }: { char: string }) {
  const lit = DIGIT_SEGS[char] ?? ''
  return (
    <svg viewBox="0 0 56 100" className="h-full w-auto" aria-hidden="true">
      {Object.entries(SEG_POINTS).map(([seg, points]) => (
        <polygon
          key={seg}
          points={points}
          fill="currentColor"
          opacity={lit.includes(seg) ? 1 : 0.08}
        />
      ))}
    </svg>
  )
}

function Colon() {
  return (
    <svg viewBox="0 0 20 100" className="h-full w-auto" aria-hidden="true">
      <rect x="5" y="26" width="10" height="10" fill="currentColor" />
      <rect x="5" y="62" width="10" height="10" fill="currentColor" />
    </svg>
  )
}

function Dot() {
  return (
    <svg viewBox="0 0 20 100" className="h-full w-auto" aria-hidden="true">
      <rect x="5" y="84" width="10" height="10" fill="currentColor" />
    </svg>
  )
}

function SevenSegText({ text, className }: { text: string; className: string }) {
  return (
    <div className={`flex items-stretch gap-1 ${className}`} role="img" aria-label={text.trim()}>
      {[...text].map((ch, i) => {
        if (ch === ':') return <Colon key={i} />
        if (ch === '.') return <Dot key={i} />
        return <SevenSegDigit key={i} char={ch} />
      })}
    </div>
  )
}

export interface ClockDisplayProps {
  /** ゲームクロックの表示文字列（未指定なら非表示） */
  gameText?: string
  /** ショットクロックの表示文字列。null = 非表示状態（全セグメント消灯） */
  shotText?: string | null
  size?: 'sm' | 'lg'
  /** ブザー・リセット時の点滅演出 */
  flash?: boolean
}

export default function ClockDisplay({ gameText, shotText, size = 'lg', flash }: ClockDisplayProps) {
  const shotHeight = size === 'lg' ? 'h-16' : 'h-9'
  const gameHeight = size === 'lg' ? 'h-10' : 'h-7'
  // 非表示状態は2桁ぶんの消灯セグメントを描く（実機の「消えている」見た目）
  const shot = shotText === null ? '  ' : shotText
  return (
    <div
      className={`flex items-center justify-center gap-6 rounded-2xl bg-slate-900 px-5 py-4 shadow-inner ${
        flash ? 'animate-clock-flash' : ''
      }`}
    >
      {gameText !== undefined && (
        <div className="text-center">
          <SevenSegText text={gameText} className={`${gameHeight} text-amber-400`} />
          <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500">GAME</p>
        </div>
      )}
      {shot !== undefined && (
        <div className="text-center">
          <SevenSegText text={shot} className={`${shotHeight} text-red-500`} />
          <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500">SHOT</p>
        </div>
      )}
    </div>
  )
}
