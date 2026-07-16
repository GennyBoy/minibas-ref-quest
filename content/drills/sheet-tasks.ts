import type { SheetTask } from './types'

/**
 * スコアシート記入ドリルのお題集。チームは A=白 / B=赤 に固定。
 * 根拠: knowledge/08-to-scoresheet（得点の記録・ファウルの記録・タイムアウト・締め）
 * 制約（validateSheetTasks で機械検証）:
 * - expected.color は penColorForQuarter(quarter) と一致
 * - ファウルの expected.slot は prefill の次の空き枠
 * - timeout の expected.value は context から再計算して一致
 */
export const sheetTasks: SheetTask[] = [
  // ===== 得点（ランニングスコア） =====
  {
    id: 'sh-001',
    category: 'score',
    ruleset: 'both',
    quarter: 1,
    prompt: '第1Q、白4番のフリースローが1本成功。白の合計は7点になった',
    fragment: { score: { from: 4, to: 10 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 6 }, mark: { symbol: 'fg', playerNo: 5 }, color: 'red' },
      { cell: { kind: 'score', team: 'B', score: 5 }, mark: { symbol: 'fg', playerNo: 9 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 7 },
      mark: { symbol: 'ft', playerNo: 4 },
      color: 'red',
    },
    explanation:
      'フリースロー（1点）は数字を塗りつぶした丸●＋隣にプレーヤー番号。第1Qは赤ペンで記入する。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-002',
    category: 'score',
    ruleset: 'both',
    quarter: 2,
    prompt: '第2Q、赤5番のフィールドゴール（2点）が成功。赤の合計は12点になった',
    fragment: { score: { from: 8, to: 14 } },
    prefill: [
      { cell: { kind: 'score', team: 'B', score: 10 }, mark: { symbol: 'fg', playerNo: 7 }, color: 'red' },
      { cell: { kind: 'score', team: 'A', score: 9 }, mark: { symbol: 'ft', playerNo: 4 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'B', score: 12 },
      mark: { symbol: 'fg', playerNo: 5 },
      color: 'dark',
    },
    explanation:
      'フィールドゴール（2点）は数字に斜線／＋隣に番号。第2Qは濃色（青/黒）ペンに持ち替える。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-003',
    category: 'score',
    ruleset: 'both',
    quarter: 3,
    prompt: '第3Q、白8番のフィールドゴールが成功。白の合計は23点になった',
    fragment: { score: { from: 19, to: 25 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 21 }, mark: { symbol: 'fg', playerNo: 6 }, color: 'dark' },
      { cell: { kind: 'score', team: 'B', score: 20 }, mark: { symbol: 'fg', playerNo: 9 }, color: 'dark' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 23 },
      mark: { symbol: 'fg', playerNo: 8 },
      color: 'red',
    },
    explanation: '2点は斜線／＋番号。第3Qは赤ペンに戻る（赤=第1Q・第3Q）。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-004',
    category: 'score',
    ruleset: 'u12',
    quarter: 4,
    prompt: '第4Q、赤の選手が誤って自チームのバスケットに入れてしまった（オウンゴール）。白の合計は15点になった',
    fragment: { score: { from: 11, to: 17 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 13 }, mark: { symbol: 'fg', playerNo: 5 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 15 },
      mark: { symbol: 'ownGoal' },
      color: 'dark',
    },
    explanation:
      'U12のオウンゴールは相手チームの得点として、番号の代わりに▲を記入（一般は相手のコート上キャプテンの得点）。第4Qは濃色。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-005',
    category: 'score',
    ruleset: 'general',
    quarter: 1,
    prompt: '第1Q、白7番のスリーポイントが成功（審判が3Pのシグナル）。白の合計は10点になった',
    fragment: { score: { from: 5, to: 11 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 7 }, mark: { symbol: 'fg', playerNo: 4 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 10 },
      mark: { symbol: 'fg3', playerNo: 7 },
      color: 'red',
    },
    explanation:
      '3点は斜線＋プレーヤー番号を○で囲む。3Pかどうかはスコアラーが判断せず、審判のシグナルで判断する。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-006',
    category: 'score',
    ruleset: 'u12',
    quarter: 3,
    prompt: '第3Q、白10番がかなり遠くからのロングシュートを沈めた。白の合計は18点になった',
    fragment: { score: { from: 14, to: 20 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 16 }, mark: { symbol: 'fg', playerNo: 8 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 18 },
      mark: { symbol: 'fg', playerNo: 10 },
      color: 'red',
    },
    explanation:
      'U12に3点はない（採用大会を除く）ので、どんなに遠くても2点＝斜線／＋番号。○囲みにしないのがポイント。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-007',
    category: 'score',
    ruleset: 'both',
    quarter: 2,
    prompt: '第2Q、赤9番のショットに白6番がゴールテンディング。得点が認められ、赤の合計は14点になった',
    fragment: { score: { from: 10, to: 16 } },
    prefill: [
      { cell: { kind: 'score', team: 'B', score: 12 }, mark: { symbol: 'fg', playerNo: 5 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'B', score: 14 },
      mark: { symbol: 'fg', playerNo: 9 },
      color: 'dark',
    },
    explanation:
      'ゴールテンディング／インタフェアレンスで認められた得点は、ショットしたプレーヤー（赤9番）の得点として記入する。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-008',
    category: 'score',
    ruleset: 'both',
    quarter: 'OT',
    prompt: 'オーバータイム、赤11番のフリースローが成功。赤の合計は51点になった',
    fragment: { score: { from: 47, to: 53 } },
    prefill: [
      { cell: { kind: 'score', team: 'B', score: 50 }, mark: { symbol: 'fg', playerNo: 7 }, color: 'dark' },
    ],
    expected: {
      cell: { kind: 'score', team: 'B', score: 51 },
      mark: { symbol: 'ft', playerNo: 11 },
      color: 'dark',
    },
    explanation: 'OTは「第4Qに起こったもの」とみなすため濃色ペンで記入する。FTは●＋番号。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-024',
    category: 'score',
    ruleset: 'both',
    quarter: 1,
    prompt: '第1Q、ゲーム最初の得点。赤3番のフリースローが1本成功した',
    fragment: { score: { from: 1, to: 6 } },
    prefill: [],
    expected: {
      cell: { kind: 'score', team: 'B', score: 1 },
      mark: { symbol: 'ft', playerNo: 3 },
      color: 'red',
    },
    explanation: '最初の得点は「1」のマスから。FTは●＋番号、第1Qは赤ペン。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },

  // ===== ファウル =====
  {
    id: 'sh-009',
    category: 'foul',
    ruleset: 'both',
    quarter: 1,
    prompt: '第1Q、白4番に2回目のパーソナルファウル（フリースローなし）',
    fragment: { fouls: { team: 'A', rows: [{ label: '4', slots: 5 }] } },
    prefill: [
      { cell: { kind: 'foul', team: 'A', row: '4', slot: 1 }, mark: { symbol: 'P' }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'foul', team: 'A', row: '4', slot: 2 },
      mark: { symbol: 'P' },
      color: 'red',
    },
    explanation:
      'パーソナルファウルはP。FTがないときは添え数字なし。枠は左から順に埋める（2個目なので2枠目）。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-010',
    category: 'foul',
    ruleset: 'both',
    quarter: 2,
    prompt: '第2Q、赤7番がシューターにファウル。フリースロー2本が与えられた（赤7番はこれが1個目）',
    fragment: { fouls: { team: 'B', rows: [{ label: '7', slots: 5 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'foul', team: 'B', row: '7', slot: 1 },
      mark: { symbol: 'P', subscript: 2 },
      color: 'dark',
    },
    explanation: 'FTが与えられるときは記号の右下に本数を小さく添える（P₂）。第2Qは濃色。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-011',
    category: 'foul',
    ruleset: 'both',
    quarter: 3,
    prompt: '第3Q、白5番にアンスポーツマンライクファウル。フリースロー2本（白5番は1個目のPあり）',
    fragment: { fouls: { team: 'A', rows: [{ label: '5', slots: 5 }] } },
    prefill: [
      { cell: { kind: 'foul', team: 'A', row: '5', slot: 1 }, mark: { symbol: 'P' }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'foul', team: 'A', row: '5', slot: 2 },
      mark: { symbol: 'U', subscript: 2 },
      color: 'red',
    },
    explanation: 'アンスポーツマンライクファウルはU。FT2本なのでU₂。第3Qは赤ペン。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-012',
    category: 'foul',
    ruleset: 'both',
    quarter: 4,
    prompt: '第4Q、赤ベンチの交代要員の言動により、赤のHCにテクニカルファウルが宣せられた。フリースロー1本',
    fragment: { fouls: { team: 'B', rows: [{ label: 'HC', slots: 3 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'foul', team: 'B', row: 'HC', slot: 1 },
      mark: { symbol: 'B', subscript: 1 },
      color: 'dark',
    },
    explanation:
      'ベンチ（A.コーチ・交代要員等）の言動によるテクニカルはHCの欄にB（B₁）。HCに記録されるC・B・Mはチームファウルに数えない。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-013',
    category: 'foul',
    ruleset: 'u12',
    quarter: 2,
    prompt: '第2Q、白チームにマンツーマンペナルティが宣せられた',
    fragment: { fouls: { team: 'A', rows: [{ label: 'HC', slots: 3 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'foul', team: 'A', row: 'HC', slot: 1 },
      mark: { symbol: 'M' },
      color: 'dark',
    },
    explanation:
      'マンツーマンペナルティ（U12・U15のみ）はHCにMとして記録。チームファウルには数えない。U12はM3個でGD（失格・退場）。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-014',
    category: 'foul',
    ruleset: 'both',
    quarter: 3,
    prompt: '第3Q、赤9番自身の言動にテクニカルファウル。フリースロー1本（赤9番は1個目のPあり）',
    fragment: { fouls: { team: 'B', rows: [{ label: '9', slots: 5 }] } },
    prefill: [
      { cell: { kind: 'foul', team: 'B', row: '9', slot: 1 }, mark: { symbol: 'P' }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'foul', team: 'B', row: '9', slot: 2 },
      mark: { symbol: 'T', subscript: 1 },
      color: 'red',
    },
    explanation:
      'プレーヤー自身のテクニカルはT（T₁）。プレーヤーのファウルなのでチームファウルにも数える（HCのC/Bとの違い）。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-015',
    category: 'foul',
    ruleset: 'both',
    quarter: 2,
    prompt: '第1Qと第2Qの間のインターバル中に、白8番にテクニカルファウル。フリースロー1本',
    fragment: { fouls: { team: 'A', rows: [{ label: '8', slots: 5 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'foul', team: 'A', row: '8', slot: 1 },
      mark: { symbol: 'T', subscript: 1 },
      color: 'dark',
    },
    explanation:
      'プレーのインターバル中のファウルは次のQの色で記録する。第1Q後のインターバル→第2Qの濃色ペン。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-016',
    category: 'foul',
    ruleset: 'general',
    quarter: 4,
    prompt: '第4Q残り1:30のスローイン中、ディフェンスの赤6番がスローインファウル（赤6番は1個目のPあり）',
    fragment: { fouls: { team: 'B', rows: [{ label: '6', slots: 5 }] } },
    prefill: [
      { cell: { kind: 'foul', team: 'B', row: '6', slot: 1 }, mark: { symbol: 'P' }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'foul', team: 'B', row: '6', slot: 2 },
      mark: { symbol: 'P', subscript: 1 },
      color: 'dark',
    },
    explanation:
      'スローインファウル（第4Q・OT最後の2分のスローイン中のディフェンスファウル）はP₁と記録し、チームファウルに数える。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-025',
    category: 'foul',
    ruleset: 'both',
    quarter: 1,
    prompt: '第1Q、白11番に5個目のパーソナルファウル（フリースローなし）',
    fragment: { fouls: { team: 'A', rows: [{ label: '11', slots: 5 }] } },
    prefill: [
      { cell: { kind: 'foul', team: 'A', row: '11', slot: 1 }, mark: { symbol: 'P' }, color: 'red' },
      { cell: { kind: 'foul', team: 'A', row: '11', slot: 2 }, mark: { symbol: 'P' }, color: 'dark' },
      { cell: { kind: 'foul', team: 'A', row: '11', slot: 3 }, mark: { symbol: 'P', subscript: 2 }, color: 'dark' },
      { cell: { kind: 'foul', team: 'A', row: '11', slot: 4 }, mark: { symbol: 'P' }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'foul', team: 'A', row: '11', slot: 5 },
      mark: { symbol: 'P' },
      color: 'red',
    },
    explanation:
      '5個目のファウルを記録したら、速やかに審判に知らせる（プレーヤーは失格）。記録自体は通常どおりP。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },

  // ===== タイムアウト（経過分・切り上げ） =====
  {
    id: 'sh-017',
    category: 'timeout',
    ruleset: 'u12',
    quarter: 2,
    prompt: 'U12（6分Q）。第2Q残り2:35で白のタイムアウトが認められた',
    context: { quarterMin: 6, remainingSec: 155 },
    fragment: {
      timeouts: {
        team: 'A',
        rows: [
          { label: '第1Q', slots: 1 },
          { label: '第2Q', slots: 1 },
        ],
      },
    },
    prefill: [
      {
        cell: { kind: 'timeout', team: 'A', row: '第1Q', slot: 1 },
        mark: { symbol: 'timeout', value: 3 },
        color: 'red',
      },
    ],
    expected: {
      cell: { kind: 'timeout', team: 'A', row: '第2Q', slot: 1 },
      mark: { symbol: 'timeout', value: 4 },
      color: 'dark',
    },
    explanation:
      '記入するのは各Qの経過時間（分・切り上げ）。6分Qで残り2:35 → 経過3分25秒 → 切り上げて「4」。U12は各Qに1回ずつ。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-018',
    category: 'timeout',
    ruleset: 'general',
    quarter: 1,
    prompt: '一般（10分Q）。第1Q残り3:44で赤のタイムアウトが認められた（前半1回目）',
    context: { quarterMin: 10, remainingSec: 224 },
    fragment: { timeouts: { team: 'B', rows: [{ label: '前半', slots: 2 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'timeout', team: 'B', row: '前半', slot: 1 },
      mark: { symbol: 'timeout', value: 7 },
      color: 'red',
    },
    explanation: '10分Qで残り3:44 → 経過6分16秒 → 切り上げて「7」。第1Qなので赤ペン。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-019',
    category: 'timeout',
    ruleset: 'u12',
    quarter: 3,
    prompt: 'U12（6分Q）。第3Q残り0:40で白のタイムアウトが認められた',
    context: { quarterMin: 6, remainingSec: 40 },
    fragment: { timeouts: { team: 'A', rows: [{ label: '第3Q', slots: 1 }] } },
    prefill: [],
    expected: {
      cell: { kind: 'timeout', team: 'A', row: '第3Q', slot: 1 },
      mark: { symbol: 'timeout', value: 6 },
      color: 'red',
    },
    explanation: '6分Qで残り0:40 → 経過5分20秒 → 切り上げて「6」。第3Qは赤ペン。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-020',
    category: 'timeout',
    ruleset: 'general',
    quarter: 4,
    prompt: '一般（10分Q）。第4Q残り2:00で赤のタイムアウトが認められた（後半2回目）',
    context: { quarterMin: 10, remainingSec: 120 },
    fragment: { timeouts: { team: 'B', rows: [{ label: '後半', slots: 3 }] } },
    prefill: [
      {
        cell: { kind: 'timeout', team: 'B', row: '後半', slot: 1 },
        mark: { symbol: 'timeout', value: 5 },
        color: 'red',
      },
    ],
    expected: {
      cell: { kind: 'timeout', team: 'B', row: '後半', slot: 2 },
      mark: { symbol: 'timeout', value: 8 },
      color: 'dark',
    },
    explanation:
      '残り2:00 → 経過8分ちょうど → 「8」。第4Qは濃色。なお第4Q残り2:00以下のタイムアウトは後半2回まで（一般）。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },

  // ===== 締め（Q終了・ゲーム終了） =====
  {
    id: 'sh-021',
    category: 'closing',
    ruleset: 'both',
    quarter: 1,
    prompt: '第1Qが終了した。白の最後の得点は14点目。ランニングスコアを締める',
    fragment: { score: { from: 12, to: 16 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 14 }, mark: { symbol: 'fg', playerNo: 6 }, color: 'red' },
      { cell: { kind: 'score', team: 'B', score: 12 }, mark: { symbol: 'fg', playerNo: 9 }, color: 'red' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 14 },
      mark: { symbol: 'closeQ' },
      color: 'red',
    },
    explanation:
      'Qの終わりはそのQのペン（第1Q=赤）で最後の得点を太い○で囲み、すぐ下に太い横線1本。下段スコア欄にQ得点も記入する。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-022',
    category: 'closing',
    ruleset: 'both',
    quarter: 4,
    prompt: 'ゲームが終了した。赤の最後の得点は42点目。ランニングスコアを締める',
    fragment: { score: { from: 40, to: 44 } },
    prefill: [
      { cell: { kind: 'score', team: 'B', score: 42 }, mark: { symbol: 'fg', playerNo: 5 }, color: 'dark' },
    ],
    expected: {
      cell: { kind: 'score', team: 'B', score: 42 },
      mark: { symbol: 'closeGame' },
      color: 'dark',
    },
    explanation:
      'ゲーム終了は最後の得点を○で囲み太い横線2本。未使用のランニングスコア列に斜線（濃色）、最終スコア・勝者・終了時刻も記入する。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
  {
    id: 'sh-023',
    category: 'closing',
    ruleset: 'both',
    quarter: 2,
    prompt: '前半（第2Q)が終了した。白の最後の得点は21点目。ランニングスコアを締める',
    fragment: { score: { from: 19, to: 23 } },
    prefill: [
      { cell: { kind: 'score', team: 'A', score: 21 }, mark: { symbol: 'ft', playerNo: 8 }, color: 'dark' },
    ],
    expected: {
      cell: { kind: 'score', team: 'A', score: 21 },
      mark: { symbol: 'closeQ' },
      color: 'dark',
    },
    explanation:
      'Q終了の締めは太線1本（ゲーム終了だけ2本）。第2Qは濃色ペン。前半終了時はファウル枠の間の太線も忘れずに。',
    refs: ['knowledge/08-to-scoresheet'],
    ruleYear: 2026,
  },
]
