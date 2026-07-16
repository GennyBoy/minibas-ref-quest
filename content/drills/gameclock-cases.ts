import type { GameClockCase } from './types'

const M = 60000

/**
 * タイマー（ゲームクロック）判断ドリルのケース集。
 * 根拠: knowledge/09-to-timer-shotclock（タイマー章: スタート／ストップする瞬間・
 * タイムアウト・インターバル・L2M）
 */
export const gameClockCases: GameClockCase[] = [
  // ===== スタートする瞬間 =====
  {
    id: 'gc-001',
    situation: 'ジャンプボール。ジャンパーが正当にボールをタップした',
    clock: { gameMs: 6 * M, running: false, quarter: '第1Q' },
    answer: { u12: 'start', general: 'start' },
    explanation:
      'ジャンプボールはジャンパーが正当にタップしたときにスタート。「スタート」と声に出し、SCオペレーターと同時にコールして目視確認する。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-002',
    situation: 'スローインのボールに、コート上のプレーヤーが触れた',
    clock: { gameMs: 4 * M + 30000, running: false, quarter: '第2Q' },
    answer: { u12: 'start', general: 'start' },
    explanation:
      'スローインはコート上のプレーヤーがボールに触れた（触れられた）ときにスタート。スローワーが持っている間はまだ動かさない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-003',
    situation: '最後のフリースローが不成功。リングで弾んだボールにコート上のプレーヤーが触れた',
    clock: { gameMs: 2 * M + 15000, running: false, quarter: '第3Q' },
    answer: { u12: 'start', general: 'start' },
    explanation:
      '最後のFTが不成功でボールがライブになったときは、リングで弾んだボールにコート上のプレーヤーが触れた瞬間にスタート。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-004',
    situation: 'スローインのタッチが自分の位置から確認できなかったが、審判が手を振り下ろすシグナルを出した',
    clock: { gameMs: 5 * M, running: false, quarter: '第1Q' },
    answer: { u12: 'start', general: 'start' },
    explanation:
      '触れた瞬間が確認できないときは、審判の手を振り下ろすシグナルでスタートする。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== スタートの引っ掛け（何もしない） =====
  {
    id: 'gc-005',
    situation: '審判がスローインするプレーヤーにボールを手渡した。コート上ではまだ誰も触れていない',
    clock: { gameMs: 3 * M + 40000, running: false, quarter: '第2Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'スローワーがボールを持っただけではスタートしない。コート上のプレーヤーが触れた瞬間まで待つ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-006',
    situation: 'ジャンプボールで、ジャンパーがタップせずにボールを両手でキャッチした',
    clock: { gameMs: 6 * M, running: false, quarter: '第1Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'スタートは「正当にタップしたとき」。ジャンパーがキャッチするのはバイオレーションで、審判が処置するまでクロックは動かさない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-007',
    situation: 'スローインのボールが誰にも触れられないままアウトオブバウンズになった',
    clock: { gameMs: 1 * M + 50000, running: false, quarter: '第4Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'コート上のプレーヤーが誰も触れていないのでスタートしない（触れた・触れられたときに初めて動かす）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-008',
    situation: 'フリースロー2本のうち1本目がリングに当たって外れた',
    clock: { gameMs: 3 * M, running: false, quarter: '第3Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'クロックを動かすのは「最後の」FTが不成功でライブになり、プレーヤーが触れたときだけ。1本目の間はボールはデッドのまま。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-009',
    situation: '最後のフリースローが成功した',
    clock: { gameMs: 2 * M + 5000, running: false, quarter: '第4Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      '最後のFT成功後はスローインで再開する。スローインのボールにコート上のプレーヤーが触れた瞬間にスタートするので、それまで動かさない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== ストップする瞬間 =====
  {
    id: 'gc-010',
    situation: 'ボールがライブでプレーが続いている中、審判が笛を鳴らした',
    clock: { gameMs: 3 * M + 20000, running: true, quarter: '第2Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation:
      'ボールがライブで審判が笛を鳴らしたら即ストップ。「ストップ」とコールし開いた手を頭上に上げる。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-011',
    situation: 'Qの競技時間が0になったが、ブザーと連動せずクロックが止まらなかった',
    clock: { gameMs: 0, running: true, quarter: '第1Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation:
      'Q・OTの競技時間終了で自動的に止まらなかったときは手動でストップする（ブザーが鳴らないときは笛で代替）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-012',
    situation: 'タイムアウトを請求しているチームがいる。その相手チームがフィールドゴールで得点した',
    clock: { gameMs: 4 * M + 10000, running: true, quarter: '第3Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation:
      'タイムアウトを請求しているチームの相手がフィールドゴールで得点したときは、速やかに止めてブザーを鳴らす。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-013',
    situation: 'ショットクロックのブザーが鳴り、続けて審判が笛を鳴らした',
    clock: { gameMs: 2 * M + 45000, running: true, quarter: '第2Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation:
      'SCブザー後に審判が笛を鳴らしたらストップ。笛が鳴らなければ止めない（gc-014と対比）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-014',
    situation: 'ショットクロックのブザーが鳴ったが、審判は笛を鳴らさずプレーが続いている',
    clock: { gameMs: 3 * M + 55000, running: true, quarter: '第4Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'SCブザーだけではクロックを止めない。審判が笛を鳴らしたときにストップする（ブザーが誤作動の場合もある）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-015',
    situation: 'プレーヤーが倒れ、審判が笛を鳴らしてゲームを止めた',
    clock: { gameMs: 5 * M + 30000, running: true, quarter: '第1Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation: '理由が何であれ、ボールがライブ中の審判の笛は即ストップ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-016',
    situation: 'ボールがサイドラインから出て、審判が笛を鳴らした',
    clock: { gameMs: 1 * M + 25000, running: true, quarter: '第3Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation: 'アウトオブバウンズの笛でストップ。スローインのタッチで再スタートする。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== L2M（最後の2分）: U12と一般で答えが分かれる目玉ケース =====
  {
    id: 'gc-017',
    situation: '第4Q残り1:30。フィールドゴールが成功した（タイムアウトの請求はない）',
    clock: { gameMs: 1 * M + 30000, running: true, quarter: '第4Q' },
    answer: { u12: 'none', general: 'stop' },
    explanation:
      '一般: 第4Q・OT残り2:00以下のFG成功ではクロックを止める。U12: この規定がないため、FG成功でも止めずに流し続ける。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-018',
    situation: 'オーバータイム残り0:45。フィールドゴールが成功した（タイムアウトの請求はない）',
    clock: { gameMs: 45000, running: true, quarter: 'OT' },
    answer: { u12: 'none', general: 'stop' },
    explanation:
      '一般: OTも残り2:00以下のFG成功で止める。U12: L2M規定なし、流し続ける（U12は原則OTなしの大会も多いが延長になった場合も同様）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-019',
    situation: '第4Q残り2:30。フィールドゴールが成功した（タイムアウトの請求はない）',
    clock: { gameMs: 2 * M + 30000, running: true, quarter: '第4Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      '「残り2:00以下」ではないので一般でも止めない。残り2:00を切っているかどうかを常に意識しておく。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-020',
    situation: '第2Q残り1:00。フィールドゴールが成功した（タイムアウトの請求はない）',
    clock: { gameMs: 1 * M, running: true, quarter: '第2Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'FG成功で止めるのは第4QとOTの残り2:00以下だけ（一般）。第2Qでは残り時間に関係なく流し続ける。U12はどのQでも止めない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-021',
    situation: 'タイムアウトを請求しているチーム自身がフィールドゴールで得点した',
    clock: { gameMs: 3 * M + 10000, running: true, quarter: '第2Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      '止めるのは「請求しているチームの相手」が得点したとき。請求チーム自身の得点では止めない（このタイミングではタイムアウトは認められない）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== 実務・修正の作法 =====
  {
    id: 'gc-022',
    situation: '笛のときに止め忘れ、2秒ほど余分に進んでしまったことに気づいた。ゲームは止まっている',
    clock: { gameMs: 2 * M + 58000, running: false, quarter: '第3Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      '止め忘れ・動かし間違いをしたら、勝手に直さず審判に知らせてからクロックを修正する。まず申告、修正はそのあと。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-023',
    situation: 'インターバル終了のブザーを鳴らした。次のQ開始のスローインは、まだ誰もボールに触れていない',
    clock: { gameMs: 6 * M, running: false, quarter: '第2Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      'インターバル終了時にクロックを次のQの時間にリセットするが、スタートはスローインのボールにコート上のプレーヤーが触れた瞬間。それまで待つ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-024',
    situation: 'ドリブル中のボールをディフェンスがはじいたが、プレーはそのまま続いている',
    clock: { gameMs: 4 * M + 20000, running: true, quarter: '第1Q' },
    answer: { u12: 'none', general: 'none' },
    explanation:
      '笛が鳴っていなければ何もしない。ボールの取り合いや乱れだけではクロックは止めない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'gc-025',
    situation: 'ヘルドボール（ジャンプボールシチュエーション）で審判が笛を鳴らした',
    clock: { gameMs: 2 * M + 40000, running: true, quarter: '第4Q' },
    answer: { u12: 'stop', general: 'stop' },
    explanation:
      'ヘルドボールも審判の笛でストップ。再開はスローインのタッチでスタート。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
]
