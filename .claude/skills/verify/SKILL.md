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

## クイズ画面の操作セレクタ

- 選択肢ボタン: `button.rounded-2xl`（single は縦並び、truefalse は2列グリッド）
- 次へ/結果ボタン: `button.bg-slate-800`
- 出題はSRSでシャッフルされるため決定的でない。正解/不正解の両ケースを踏むには、毎問 choices[0] をクリックしてフィードバックの状態（クラス名 bg-emerald-500 / bg-rose-500）で判別しながら進めるのが確実。
- 進行状態は localStorage（zustand persist）に残る。クリーンに始めたいときは新しい headless プロファイル（デフォルトで毎回新規）でOK。
