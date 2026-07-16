import type { ShotClockCase } from './types'

/**
 * SCオペレーター反射ドリルのケース集。
 * 根拠: knowledge/09-to-timer-shotclock（操作の基本ルール・U12の違い・実務の鉄則）
 * U12はフロントコート／スローインラインの概念がないため、
 * situation は両ルールセットで成立する表現で書き、コート位置は
 * 「相手バスケットに近い（一般ではフロントコート）」のように補って表す。
 */
export const shotClockCases: ShotClockCase[] = [
  // ===== 24秒リセット（U12・一般共通） =====
  {
    id: 'sc-001',
    situation: 'ショットが正当にバスケットに入った（フィールドゴール成功）',
    shotClockBefore: 9,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      'ボールが正当にバスケットに入ったら24秒にリセット（表示は非表示、消せない機材は24を表示）。相手チームの新しい攻撃が始まる。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-002',
    situation: 'ショットがリングに当たって外れ、ディフェンス側のチームがリバウンドをつかんだ',
    shotClockBefore: 3,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      'ボールがリングに触れて相手チーム（守っていた側）がコントロールしたら24秒にリセット。攻撃側が取り返したときだけ14秒（sc-013参照）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-003',
    situation: 'ドリブル中のボールをディフェンスがスティールし、両手でしっかり保持した',
    shotClockBefore: 15,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      '新たなチームがコントロールを得たら即24秒にリセットして、そのままスタート（プレーは止まらないので止めない）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-004',
    situation: 'ディフェンスのシューターに対するファウルで、フリースロー2本が与えられた',
    shotClockBefore: 7,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      'フリースローを行うときは24秒にリセット（非表示）。例外は攻撃側のテクニカルファウルの罰則FTのみ（sc-009参照）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-005',
    situation: 'オフェンスのパスをディフェンスがインターセプトしてコントロールした',
    shotClockBefore: 11,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      'スティールと同じく、新たなチームがコントロールを得た瞬間に24秒へ即リセット＋スタート。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-006',
    situation:
      'オフェンスがトラベリング。相手チームに自分たちのバスケットから遠い位置（一般ではバックコート）からのスローインが与えられた',
    shotClockBefore: 13,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      'バイオレーションで相手チームにスローインが与えられるときは24秒リセット（一般はバックコートからのとき。U12は位置に関係なく常に24秒）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-007',
    situation:
      '24秒のブザーが鳴った時点でショットはリングに当たらず、審判が笛を吹いてバイオレーション。相手チームのスローインで再開（位置は相手のバスケットから遠い側）',
    shotClockBefore: 1,
    answer: { u12: 'reset24', general: 'reset24' },
    explanation:
      '24秒バイオレーション後は相手チームの新しいコントロール。24秒にリセットする（一般でバックコートからのスローインの場面）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== 継続（U12・一般共通） =====
  {
    id: 'sc-008',
    situation:
      'オフェンスのパスがディフェンスに当たってサイドラインから出た。同じチームのスローインで再開、ショットクロックは残り20秒',
    shotClockBefore: 20,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      '相手が最後に触れてアウトオブバウンズになり、同じチームが引き続きスローインするときは止めるだけでリセットしない。残り20秒（14秒以上）なので一般でも継続（残り13秒以下だと一般は14秒リセット: sc-021参照）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-009',
    situation:
      'ボールをコントロールしているチームにテクニカルファウル。相手のフリースロー1本のあと、ゲームは元の状態から再開される',
    shotClockBefore: 13,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      '攻撃側（コントロールしているチーム）のテクニカルファウルの罰則FTは、ショットクロック継続のまま行う。「FT=24秒リセット」の唯一の例外。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-010',
    situation:
      'コントロールしているチームのプレーヤーが負傷してゲームが止まった。同じチームのスローインで再開、残り16秒',
    shotClockBefore: 16,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      'コントロールチームのプレーヤーの怪我でゲームが止まり、同じチームのスローインになるときは継続（リセットしない）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-011',
    situation: 'ダブルファウルが宣せられ、それまでコントロールしていたチームのスローインで再開。残り15秒',
    shotClockBefore: 15,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      'ダブルファウルや罰則の相殺で、それまでコントロールしていたチームに引き続きスローインが与えられるときは継続。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-012',
    situation:
      'ヘルドボール（ジャンプボールシチュエーション）。アローはそれまでコントロールしていたチーム側で、同じチームのスローインで再開。残り17秒',
    shotClockBefore: 17,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      'JBSでそれまでコントロールしていたチームに引き続きスローインが与えられるときは継続（残り14秒以上なので一般でも継続）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-013',
    situation: 'ディフェンスが片手でボールをタップしたが、オフェンスはそのままドリブルを続けている',
    shotClockBefore: 12,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      'ディフェンスが片手でタップしただけではコントロールは変わらない（両手で保持・片手で保持したら変わる）。プレー継続中なので何もしない。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-014',
    situation: '誤ってショットクロックのブザーが鳴ってしまったが、審判は笛を鳴らさずゲームが続いている',
    shotClockBefore: 10,
    answer: { u12: 'keep', general: 'keep' },
    explanation:
      '誤って鳴ったブザーは無視されゲーム続行。コントロールしているチームが不利になった場合のみ審判が止めて訂正する。オペレーターはそのまま計測を続ける。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== 14秒リセット（U12でも14秒になる2場面＋その派生） =====
  {
    id: 'sc-015',
    situation: 'ショットがリングに当たって外れ、攻撃していたチームが再びリバウンドをつかんだ（オフェンスリバウンド）',
    shotClockBefore: 5,
    answer: { u12: 'reset14', general: 'reset14' },
    explanation:
      'ショットがリングに触れて不成功となり攻撃していたチームが再コントロールしたら14秒にリセット。U12で14秒になる数少ない場面のひとつ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-016',
    situation: 'ロングパスが偶然リングに当たり、パスを出したチームがそのまま再びコントロールした',
    shotClockBefore: 9,
    answer: { u12: 'reset14', general: 'reset14' },
    explanation:
      'パスが偶然リングに当たった場合もショットと同じ扱い。リングに触れて攻撃側が再コントロールなら14秒にリセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-017',
    situation: '最後のフリースローがリングに当たって不成功。シューター側のチームがリバウンドをつかんだ',
    shotClockBefore: 24,
    answer: { u12: 'reset14', general: 'reset14' },
    explanation:
      '最後のFTがリングに触れて不成功となり、攻撃していたチームが再コントロールしたら14秒にリセット（コントロール確立を見てから14/24を判断する場面）。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-018',
    situation:
      'ショットのボールがリングとバックボードの間に挟まった。ジャンプボールシチュエーションのアローは攻撃していたチーム側',
    shotClockBefore: 6,
    answer: { u12: 'reset14', general: 'reset14' },
    explanation:
      'ボールがリングに挟まったJBSで攻撃側にボールが与えられるときは14秒にリセット。U12で14秒になるもうひとつの場面。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== U12と一般で答えが分かれるケース（くらべるモードの対象） =====
  {
    id: 'sc-019',
    situation:
      'ディフェンスのパーソナルファウル（FTなし）。攻撃側が相手バスケットに近い位置（一般ではフロントコート）からスローイン。ショットクロック残り10秒',
    shotClockBefore: 10,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      '一般: 同じチームがフロントコートから引き続きスローインし残り13秒以下 → 14秒にリセット。U12: フロントコートの概念がなく、相手のファウル後のスローインは常に24秒リセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-020',
    situation:
      'ディフェンスのパーソナルファウル（FTなし）。攻撃側が相手バスケットに近い位置（一般ではフロントコート）からスローイン。ショットクロック残り20秒',
    shotClockBefore: 20,
    answer: { u12: 'reset24', general: 'keep' },
    explanation:
      '一般: フロントコートのスローインで残り14秒以上 → 継続。U12: 相手のファウル後のスローインは残り秒数に関係なく常に24秒リセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-021',
    situation:
      'オフェンスのパスがディフェンスに当たってエンドラインから出た。同じチームが相手バスケットに近い位置（一般ではフロントコート）からスローイン。残り9秒',
    shotClockBefore: 9,
    answer: { u12: 'keep', general: 'reset14' },
    explanation:
      '一般: 同じチームのフロントコートからのスローインで残り13秒以下 → 14秒にリセット。U12: 13秒以下ルールがないので、相手が出したOOBは残り9秒のまま継続。U12の方が「継続」になる逆転ケース。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-022',
    situation: 'アンスポーツマンライクファウルの罰則。フリースローのあと、ファウルされたチームのスローインで再開',
    shotClockBefore: 8,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      '一般: アンスポ・DQの罰則はスローインラインからのスローインで14秒。U12: スローインラインがなく、センターライン延長から24秒でリセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-023',
    situation: 'ディスクォリファイングファウルの罰則。フリースローのあと、ファウルされたチームのスローインで再開',
    shotClockBefore: 12,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      'アンスポと同じ罰則の扱い。一般はスローインラインから14秒、U12はセンターライン延長から24秒。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-024',
    situation:
      'ディフェンスのキックボール（バイオレーション）。攻撃側が相手バスケットに近い位置（一般ではフロントコート）からスローイン。残り8秒',
    shotClockBefore: 8,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      '一般: 相手のバイオレーション後にフロントコートからスローインで残り13秒以下 → 14秒。U12: 相手のバイオレーション後は常に24秒リセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-025',
    situation:
      'ディフェンスのイリーガルスクリーン気味の接触でパーソナルファウル。攻撃側が相手バスケットに近い位置（一般ではフロントコート）からスローイン。残り14秒ちょうど',
    shotClockBefore: 14,
    answer: { u12: 'reset24', general: 'keep' },
    explanation:
      '一般: 残り「14秒以上」は継続なので14秒ちょうどは継続（13秒以下で14秒リセット）。U12: 相手のファウル後は常に24秒リセット。境目の数字に注意。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-026',
    situation:
      'ヘルドボール。アローはそれまでコントロールしていなかったチーム側で、相手バスケットに近い位置（一般ではフロントコート）からスローイン。残り18秒',
    shotClockBefore: 18,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      '一般: それまでコントロールしていなかったチームがJBSの結果フロントコートからスローイン → 14秒にリセット。U12: 新しいチームのコントロールは常に24秒。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-027',
    situation:
      'オフェンスのプッシング（オフェンスファウル）。相手チームが自分たちのバスケットに近い位置（一般ではフロントコート）からスローイン。残り21秒',
    shotClockBefore: 21,
    answer: { u12: 'reset24', general: 'reset14' },
    explanation:
      '一般: それまでコントロールしていなかったチームがファウルの結果フロントコートからスローインを与えられるとき → 14秒。U12: 常に24秒リセット。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },

  // ===== 止めるだけ（実務の鉄則: いきなりリセットしない） =====
  {
    id: 'sc-028',
    situation: '審判が笛を鳴らした。何が起きたのか、まだレポートやシグナルは出ていない',
    shotClockBefore: 11,
    answer: { u12: 'stopOnly', general: 'stopOnly' },
    explanation:
      '鉄則: 審判の笛 → まずストップ → レポート／シグナルを確認 → 継続かリセットかを判断。いきなりリセットしない。リセット前に残り秒数を覚えておく。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-029',
    situation: '審判が笛を鳴らしてファウルの合図。ただしどちらのチームのファウルかまだ示されていない',
    shotClockBefore: 19,
    answer: { u12: 'stopOnly', general: 'stopOnly' },
    explanation:
      'どちらのファウルかで継続（コントロール側が受けたFTなしの場面）か24秒（オフェンスファウル）かが変わる。レポートを確認するまでは止めるだけ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-030',
    situation: 'ボールがリングに挟まって審判が笛。ジャンプボールシチュエーションのアローはまだ確認できていない',
    shotClockBefore: 7,
    answer: { u12: 'stopOnly', general: 'stopOnly' },
    explanation:
      'アローが攻撃側なら14秒、相手側なら24秒（一般はフロントコートなら14秒）と、アロー次第で答えが変わる。確認できるまでは止めるだけ。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-031',
    situation: 'プレーヤーが倒れて審判がゲームを止めた。どちらのチームのプレーヤーの負傷か、まだ分からない',
    shotClockBefore: 14,
    answer: { u12: 'stopOnly', general: 'stopOnly' },
    explanation:
      'コントロール側の負傷なら継続、状況次第で変わる可能性もある。審判の処置が分かるまでは止めるだけ。判断を急がないのも大事なスキル。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
  {
    id: 'sc-032',
    situation: '誤って24秒にリセットしてしまったことに気づいた。ゲームは続いている',
    shotClockBefore: 24,
    answer: { u12: 'stopOnly', general: 'stopOnly' },
    explanation:
      '誤リセットに気づいたら表示を止めて（非表示または24）、その瞬間のゲームクロック残り時間を記憶・メモしてストップウォッチを動かす。プレー中にブザーで止めてはいけない。ボールがデッドになってから審判に知らせる。',
    refs: ['knowledge/09-to-timer-shotclock'],
    ruleYear: 2026,
  },
]
