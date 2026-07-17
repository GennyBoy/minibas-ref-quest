---
name: verify
description: このリポジトリ（minibas-ref-quest）の変更をブラウザで実際に動かして確認する手順。UI変更の検証、スクリーンショット取得のとき。
---

# minibas-ref-quest の動作検証

## ビルドと起動

```bash
npm run build                                # tsc + vite build（Tailwind CSSの生成確認もこれで）
npx vite preview --port 4519 --strictPort    # dist を配信（バックグラウンド起動）
```

URL は `http://localhost:4519/minibas-ref-quest/`（`base` 設定あり）。

## ルーティングの注意（ハマりどころ）

**ハッシュルーティング**を使っている。`history.pushState` や素のパス URL では遷移しない。

- クイズ: `http://localhost:4519/minibas-ref-quest/#/quiz`
- 役割別: `#/to/scorer` など（TO_ROLES: scorer / a-scorer / timer / sc-operator / to-supporter）

## ブラウザ操作

Playwright は未導入。puppeteer-core + システムの Chrome を使う（scratchpad に `npm i puppeteer-core`）:

```js
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 430, height: 900 },  // モバイル想定のアプリ
})
```

## ルール閲覧ページ（#/rules）の操作セレクタ

- 一覧・検索: `#/rules`、章表示: `#/rules/<slug>`、セクション直リンク: `#/rules/<slug>/s<N>`
- 検索入力: `input[type="search"]`（結果はセクション単位カード、ハイライトは `mark`）
- TOCチップ: `nav.flex-wrap button`（クリックで `/rules/:slug/sN` に遷移して scrollIntoView）
- 本文中のwikilinkは `.rules-md a[href^="#/rules/"]`（素のhashアンカー。useHashLocationが拾う）
- クイズのフィードバックの根拠リンク: `p a[href^="/rules/"]`（knowledge/ refのみリンク化される）

## TOシミュレーター（#/tosim/:role・ターン制）の操作セレクタ

- 入口: `#/tosim/sc-operator` / `#/tosim/scorer`（未実装役割は「近日公開」フォールバック）。役割ハブのカードは `a[href="#/tosim/<role>"]`
- 最初は**セグメント選択画面**（「1試合通し」「第1Qのみ」〜「第4Qのみ」のテキストを持つボタン）。選択でターン制セッション開始
- 進行は「実況カード → 操作 → ⭕/❌フィードバック → 『次の場面へ』/『結果を見る』」。汎用ループは「次の場面へ/結果を見る ボタンがあれば押す、なければ回答する」で書く
- SCパネル: 静止ClockDisplay＋3ボタン（textContent「24リセット」「14リセット」「継続（そのまま）」）。連打ロックなし
- スコアラーパネル: 得点マスは `span.text-sm.text-slate-400` の数字テキストで特定（同スコアで白→赤の順）。記号は「FG 2点」「FT 1点」等、ペンは「赤ペン/濃色ペン」、確定は「✍️ 記入する」。APアローは「◀ 白へ」「赤へ ▶」（アロー期待のステップでもマス記入で回答できる＝誤答扱い）
- 結果画面は「もう一度挑戦する」ボタンで判定。フィルタは「すべて/❌ミスだけ」。自己ベストは drillBest の `sim/<scriptId>/<role>/<full|q1..q4>` キー
- 注意: 同一ハッシュURLへの `page.goto` はReact stateをリセットしない。セッションを最初からやり直すときは `page.reload()` を挟む

## クイズ画面の操作セレクタ

- 選択肢ボタン: `button.rounded-2xl`（single は縦並び、truefalse は2列グリッド）
- 次へ/結果ボタン: `button.bg-slate-800`
- 出題はSRSでシャッフルされるため決定的でない。正解/不正解の両ケースを踏むには、毎問 choices[0] をクリックしてフィードバックの状態（クラス名 bg-emerald-500 / bg-rose-500）で判別しながら進めるのが確実。
- 進行状態は localStorage（zustand persist）に残る。クリーンに始めたいときは新しい headless プロファイル（デフォルトで毎回新規）でOK。
