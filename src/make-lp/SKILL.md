---
name: make-lp
description: |
  汎用的な定型文ではなく、**このリポジトリ自身**のREADME/package.json/AGENTS.mdなどから内容を導き出した静的な`docs/index.html`ランディングページ（加えて`docs/style.css`/`docs/main.js`、ビルド工程なし）を作成または更新する。ライト/ダークテーマ、OGP（X.comを含む）、JSON-LDスキーマ、Twemoji SVGファビコン、`multilanguagejs` のCDNビルドによる多言語対応、クリップボードへのコピー機能付きコマンドボックスに対応する。
  トリガー例: "ランディングページを作って","ランディングページを生成して","ランディングページを更新して"
---

# make-lp

配置先のリポジトリから内容を引き出した静的ランディングページ（`docs/index.html` + `docs/style.css` + `docs/main.js`）を生成せよ。リポジトリに実在しない機能・プロバイダー・コマンドは決して掲載するな。

## 内容の信頼できる情報源（Source of Truth）

何かを書く前に、以下を読め：

- `README.*` — 概要、機能、技術スタック、インストール/クイックスタートのコマンド
- `LICENSE*` — ライセンス名、バージョン、URL
- `CHANGELOG.*` — 変更履歴の要約
- `package.json`,`composer.json`,`requirements.txt`など: 名前、説明、依存関係（技術スタックのバッジの元になる）
- `AGENTS.md`,`CLAUDE.md`,`config.toml`,`GEMINI.md`など: プロジェクトの目的、およびプロジェクトにあればサポート対象プロバイダー/設定の表
- 既存の `docs/index.html`（存在する場合）: 明示的にリデザインを依頼されていない限り、一から作り直すのではなく、そのセクション構成を再利用して内容をその場で編集せよ

## 必須要素

1. **ライト/ダークテーマ** — `prefers-color-scheme: dark` メディアクエリでCSSカスタムプロパティ（`--bg`、`--text`、`--accent` など）を上書きせよ。依頼されない限り、JSによるテーマ切り替えは付けるな。
2. **OGP + Twitter/Xカード** — `og:title`、`og:description`、`og:url`、`og:image`、`og:type`、`og:site_name`、`twitter:card`、`twitter:title`、`twitter:description`、`twitter:image`。`og:image`/`twitter:image` は、リポジトリにすでに実在するアセット（例：`social-preview.png`）を指せ。存在しなければ、先に `make-social-preview` スキルで生成せよ。
3. **JSON-LDスキーマ** — `<script type="application/ld+json">` ブロック（アプリ/ツールなら `SoftwareApplication`、そうでなければプロジェクトに合う任意の `@type`）。OGPの説明と矛盾がないように保て。
4. **ファビコン** — プロジェクトに合ったTwemoji SVGを、`<link rel="icon">` で参照せよ。
5. **`multilanguagejs` による多言語対応（CDN、ビルド工程なし）**：
   ```html
   <script src="https://unpkg.com/multilanguagejs@2.0.1/dist/multilanguagejs.umd.cjs"></script>
   ```
   翻訳対象の要素はすべて `<template type="language-group">` で囲み、その中に言語ごとに1つずつ、`language="xx"` 属性（`lang` ではない）を持つ子要素を置け：
   ```html
   <h2>
     <template type="language-group">
       <span language="en">Features</span>
       <span language="ja">機能</span>
     </template>
   </h2>
   ```
   各 `template[type=language-group]` には、サポート対象の言語ごとに要素を**たった1つ**だけ含めよ — `multilanguagejs` はテンプレートごとに最初に一致した `[language=X]` を採用するため、重複があると内容が黙って失われる。

   `main.js` で初期化せよ：
   ```js
   var ml = new MultilanguageJS({ languages: [...], defaultLanguage: "en" });
   ml.setLanguage(lang); // 読み込み時、および <select> 切り替えの change イベント時
   ```
   `<title>` と `<meta name="description">` は `[language]` テンプレートの対象**外**である（ライブラリは一致した要素の `textContent` しか更新せず、`<meta>` タグの翻訳はテキストではなく `content` 属性にあるため）。`main.js` に言語ごとの小さな `{ title, description }` 辞書を持たせ、`ml.setLanguage()` と併せてこの2つのタグを手動で更新せよ。

   訪問者の言語を `navigator.language` から判定し、選択された言語を `localStorage` に保存して、読み込み時にはブラウザ判定にフォールバックする前にそれを再適用せよ。

   **必須の言語セット（アプリ自体が何に対応しているかに関係なく、常に）：** 英語（`en`）、日本語（`ja`）、中国語（`zh`）、スペイン語（`es`）、ロシア語（`ru`）、ドイツ語(`de`) — 最低6言語。`src/locales/*.json` やアプリ独自の `i18n.ts`/`i18n.js` がその一部しかカバーしていなくても適用される（例：`en`/`ja` のみのアプリでも、ランディングページは6言語にせよ）。依頼があればこの6言語に異なる言語を追加してよい。
6. **クリップボードへのコピーボタン** — `<code>` ブロックで示すインストール/実行コマンドにはすべて、インラインSVGアイコン（絵文字は決して使わない）のコピーボタンを付け、`navigator.clipboard.writeText()` によるチェックマークの確認状態を持たせよ。レイアウトの一貫性を保つため、`<code>` とそのボタンを `.code-row` のflexコンテナで囲め。
7. **レスポンシブ** — モバイルファースト。明示的にスクロールさせる意図のあるコンテナ（例：横に広い比較表）の内部を除き、狭いビューポートで横スクロールを発生させるな。
8. **ビルド工程なし** — このページは、アプリ自体がどのバンドラー（Viteなど）を使っているかに関係なく、HTMLファイルを開くか静的フォルダをそのまま配信するだけで動作させよ。`main.js` を可読なソースとして保て。ページでは `<script src="main.js">` を直接読み込め。
9. **セマンティックな構成** — ヒーロー（見出し、リード文、CTA、主要な実行コマンド）、スクリーンショット（既存のリポジトリ/GitHubのアセットURLがあれば再利用）、機能グリッド、クイックスタート/インストールのコマンド、技術スタックのバッジ、フッター — これらをセマンティックに構成せよ。
10. **既存のCSSを再利用** — 並行する独自のスタイリング体系を新たに作らず、リポジトリの `docs/style.css` にすでにあるCSSカスタムプロパティとクラス名を再利用せよ。
11. **デザインシステムの尊重** — 既存のAIエージェント実行環境にあるデザインシステムを尊重せよ。新しいCSSを追加する場合は、既存のカスタムプロパティとクラス名を再利用し、リポジトリのデザインシステムに沿った命名規則やデザイン・レイアウト・トンマナを守れ。

## ワークフロー

1. 上記の内容の情報源を読め。
2. `docs/`が存在しない場合は作成せよ。
3. `docs/index.html` がすでに存在する場合は、その場で編集せよ — 明示的にリデザインを依頼されていない限り、丸ごと置き換えず、セクション構成を維持して内容を更新せよ。
4. セクションをセマンティックに構成せよ：ヒーロー（見出し、リード文、CTA、主要な実行コマンド）、スクリーンショット（既存のリポジトリ/GitHubのアセットURLがあれば再利用）、機能グリッド、比較/設定の表（比較する価値のある複数のプロバイダー/モード/バックエンドがプロジェクトにある場合）、クイックスタート/インストールのコマンド、技術スタックのバッジ、フッター。
5. 並行する独自のスタイリング体系を新たに作らず、リポジトリの `docs/style.css` にすでにあるCSSカスタムプロパティとクラス名を再利用せよ。
6. `docs/main.js` を更新せよ。
7. 完了前に検証せよ：インタラクティブなアイコンに絵文字を使っていないこと（SVGのみ）。すべての `template[type=language-group]` が、サポート対象の言語ごとにちょうど1つの子要素を持ち、重複も欠落もないこと。OGP/JSON-LDがリポジトリに実在するファイル/URLを指していること。