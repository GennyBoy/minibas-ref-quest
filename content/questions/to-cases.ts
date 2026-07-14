import type { Question } from '../types'

/** TOの難しいシチュエーション（ケーススタディ） */
export const toCasesQuestions: Question[] = [
  {
    id: 'cs-001',
    domain: 'to-cases',
    roles: ['scorer', 'a-scorer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt:
      'ゲーム中、スコアボードの表示とスコアシートのランニングスコアが食い違っていることに気づいた。正しい対応は？',
    choices: [
      'すぐブザーを鳴らしてゲームを止め、審判に確認する',
      '次にボールがデッドでクロックが止まったときにブザーで審判を呼ぶ。スコアシートが正しければボードを直させる',
      'スコアボードに合わせてスコアシートを書き直す',
    ],
    answer: 1,
    explanation:
      'プレー中にブザーでゲームを止めてはいけない。残り時間とスコアを記録しておき、次のボールデッドで審判を呼んで確認する。スコアシートは常にスコアボードより優先する。',
    refs: ['JBA TOマニュアル', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-002',
    domain: 'to-cases',
    roles: ['sc-operator'],
    ruleset: 'both',
    difficulty: 3,
    type: 'single',
    prompt:
      'プレッシャーディフェンス中、コントロールが変わっていないのに誤ってショットクロックを24秒にリセットしてしまった。正しい対応は？',
    choices: [
      'すぐブザーを鳴らしてゲームを止め、審判に申告する',
      '何もなかったことにして続ける',
      'その瞬間のゲームクロックの残り時間をメモし、表示を止めてストップウォッチで計測。審判が気づかなければ次のボールデッドで知らせる',
    ],
    answer: 2,
    explanation:
      'ショットクロックの誤りはTOがゲームを止められる事由ではない。誤った瞬間のゲームクロック残り時間を記憶・メモして根拠を残し、次のデッドで審判に知らせる。予防策は「笛→ストップ→レポート確認→判断」の手順とリセット前に残り秒数を覚えること。',
    refs: ['JBA TOマニュアル 7.5.3', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-003',
    domain: 'to-cases',
    roles: ['sc-operator', 'timer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt: 'コントロール継続中にショットクロックのブザーが誤作動で鳴ってしまった。ゲームはどうなる？',
    choices: [
      'ボールデッドになり、審判が協議する',
      'ブザーは無視されゲーム続行。コントロールチームが不利になった場合のみ審判が止めて訂正する',
      '自動的に24秒バイオレーションになる',
    ],
    answer: 1,
    explanation:
      '誤ったブザーはボールをデッドにしない。ゲームは続行され、直ちにリセットして計り直す。コントロールしていたチームが不利になったと審判が判断した場合のみゲームが止まり、ポゼッションはそのチームに戻る。',
    refs: ['JBA TOマニュアル 7.5.3・4.6', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-004',
    domain: 'to-cases',
    roles: ['timer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt: '笛が鳴ったのにゲームクロックを止め忘れ、数秒流れてしまった。正しい対応は？',
    choices: [
      '気づいた時点で黙って流れた分を戻す',
      '審判に知らせてからクロックを修正する',
      '次のクォーターで調整する',
    ],
    answer: 1,
    explanation:
      'クロックの修正は必ず審判に知らせてから行う（勝手に直さない）。予防にはスタート／ストップと同時の声出し・目視確認と、手を握って下ろす／開いて上げるジェスチャーの徹底。',
    refs: ['JBA TOマニュアル 6.4', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-005',
    domain: 'to-cases',
    roles: ['scorer', 'a-scorer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt:
      '5個目のファウルを記録したプレーヤーがコートに残ったまま、審判が気づかずスローインを始めようとしている。どうする？',
    choices: [
      'ブザーを鳴らして審判に知らせる',
      'ボールデッドまで待ってから知らせる',
      'ベンチに向かって声をかける',
    ],
    answer: 0,
    explanation:
      'プレーヤーの資格に関わるため、この場合はブザーを鳴らしてよい。5ファウル・失格退場の通知はスコアラーの任務。3〜4個目の時点で「白4番、4つ目」とクルーに共有して交代を予測しておくのが予防策。',
    refs: ['JBA TOマニュアル 4.1', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-006',
    domain: 'to-cases',
    roles: ['scorer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt: 'HCがテーブルに来て「5番と交代させたい」と申し出た。どう対応する？',
    choices: [
      'そのまま受け付けて交代の合図をする',
      '受け付けず、交代要員自身に申し出させるよう伝える',
      '審判に無線で確認する',
    ],
    answer: 1,
    explanation:
      '交代を申し出る権利は交代要員自身のみ（タイムアウトはHC・A.コーチのみ、と対になっている）。時間のあるときに審判へ状況を伝え、HCに注意してもらう。なおU12ではQ1〜Q3の交代はインターバル中のみ。',
    refs: ['競技規則 19-3-1', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-007',
    domain: 'to-cases',
    roles: ['scorer'],
    ruleset: 'both',
    difficulty: 3,
    type: 'single',
    prompt: 'タイムアウトの請求と交代の申し出が同時にあった。ブザーはどう鳴らす？',
    choices: [
      'タイムアウト用と交代用に2度鳴らす',
      '1度だけ鳴らし、タイムアウトの合図の後に続けて交代の合図をする',
      '交代を先に処理してからタイムアウトのブザーを鳴らす',
    ],
    answer: 1,
    explanation:
      'ブザーは1度だけ。タイムアウトのブザーで交代要員はプレーヤーになれるため、2度鳴らす必要がない。合図はタイムアウト→続けて（ブザーなしで）交代の順。',
    refs: ['U12 TOハンドブック', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-008',
    domain: 'to-cases',
    roles: ['scorer', 'timer'],
    ruleset: 'both',
    difficulty: 3,
    type: 'single',
    prompt: '守備側のHCが「シュートが入ったらタイムアウト」と条件付きで請求してきた。実務上の対応は？',
    choices: [
      '条件付き請求として正式に受け付ける',
      '規則上は認められないが、実際に得点されたらブザーを鳴らす。クルー全員（特にタイマー）に共有し、審判からHCに注意を促してもらう',
      '請求自体を無効として無視する',
    ],
    answer: 1,
    explanation:
      '条件付きの請求は規則上認められないが、実務では実際に得点されたらブザーを鳴らして対応する。ファウル等でクロックが止まった場合はHCにキャンセルの意思を確認してから鳴らす。「入ったら赤のタイムアウト」とクルー共有しておくのがコツ。',
    refs: ['JBA TOマニュアル 4.6.1', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-009',
    domain: 'to-cases',
    roles: ['scorer'],
    ruleset: 'both',
    difficulty: 3,
    type: 'single',
    prompt:
      'HCが×印をつけたスターター5人と、実際にコートに立っている5人が違う。ゲーム開始後に発見された場合はどうなる？',
    choices: [
      'ただちに本来のプレーヤーに交代させる（罰則なし）',
      '誤りは無視され、ゲームはそのまま続けられる',
      'テクニカルファウルが宣せられる',
    ],
    answer: 1,
    explanation:
      'トスアップ前に気づけば本来のプレーヤーに交代させる（罰則なし）が、ゲーム開始後に発見された場合は誤りは無視されゲーム続行。だからこそ開始時にコート上の5人と×印を照合してから○で囲む。',
    refs: ['インタープリテーション 7-4', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-010',
    domain: 'to-cases',
    roles: ['scorer'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt:
      'タイムアウト請求に気づくのが遅れ、スローインのボールがプレーヤーに渡った後にブザーを鳴らしてしまい、審判がゲームを止めた。タイムアウトは？',
    choices: [
      '認められる（請求は有効なので）',
      '認められない。ブザーが遅かったと正直に審判へ申告し、ゲームは速やかに再開される',
      '審判の判断で認められることもある',
    ],
    answer: 1,
    explanation:
      'タイムアウトが認められる時機は「スローイン（または最初のFT）のボールがプレーヤーに与えられたとき」に終わる。時機の後のブザーは無効。請求自体は消えないので、HCに継続の意思を確認して次の時機に改めて鳴らす。',
    refs: ['インタープリテーション 18/19-8', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-011',
    domain: 'to-cases',
    roles: ['scorer', 'a-scorer', 'to-supporter'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt:
      '誤った向きのAPアローのままスローインが行われ、ボールがコート上のプレーヤーに正当に触れた。どうなる？',
    choices: [
      'やり直しになる',
      '訂正できない。ただしスローインを与えられなかったチームは次のJBSでの権利を失わない',
      'クルーチーフの判断で得点を取り消す',
    ],
    answer: 1,
    explanation:
      'ボールがコート上のプレーヤーに正当に触れた後は訂正できない。反転忘れに気づいたら次のデッドで審判に伝えてから反転する。JBSが宣せられたらアローに手を置く習慣と、反転時のコール交換が予防策。',
    refs: ['インタープリテーション 12-8', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
  {
    id: 'cs-012',
    domain: 'to-cases',
    roles: ['timer', 'to-supporter'],
    ruleset: 'both',
    difficulty: 2,
    type: 'single',
    prompt: 'ゲーム中にスコアボードとクロックの表示が突然消えた。最初にやることは？',
    choices: [
      'ブザーを鳴らしてすぐゲームを止める',
      '気づいたときからの経過時間をストップウォッチで計り始め、声や手振りで審判に知らせる',
      '機材を再起動する',
    ],
    answer: 1,
    explanation:
      'まず経過時間の計測を確保する（ストップウォッチ）。審判には声かけ・手を振るなどで知らせ、できるだけ早く止めてもらう。ボールがデッドになるまでブザーでゲームを止めてはいけない。ゲーム前に機材の修正方法を確認しておくのが予防策。',
    refs: ['TO主任マニュアル 7-(15)', 'knowledge/10-to-difficult-cases'],
    ruleYear: 2026,
  },
]
