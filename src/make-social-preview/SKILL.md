---
name: make-social-preview
description: |
  リポジトリのsocial preview画像(social-preview.svg)を作成する。GitHub social preview、OGP画像、SNSカード画像の作成依頼時に使用。
  トリガー例: "social preview画像を作って","social preview画像を生成して","social preview画像を更新して"
---

# make-social-previewスキルの詳細

social-preview.svgを作れ。サイズは1280×640。内容(リポジトリ名・説明)はREADME等から取得せよ。

- 絵文字はTwemojiベクターにせよ。SVGはjsDelivrの`jdecked/twemoji`から取得し、外部参照でなくpathをインラインで埋め込め(ラスタライズ時の欠落防止)。
- GitHubのsocial preview・OGPはSVG非対応のため、同サイズのPNGも書き出せ。変換手段が無ければその旨ユーザーに伝えよ。
