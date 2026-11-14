---
name: modernize-repo
description: |
   JavaScript、Python、PHPのリポジトリを、Docker化・CI/CD・README更新によってモダナイズする。
   トリガー例:"リポジトリをモダナイズして","Docker化して","CI/CDを追加して","READMEを更新して"
---

# modernize-repoスキルの詳細

ソースコードからリポジトリにDockerとpinactでハッシュでバージョンを固定したGitHub ActionsとREADMEを追加してモダナイズせよ。

## 使い方
```
/modernize-repo [--skip-docker] [--skip-ci] [--readme-only] [js|python|php]
```

## 参照ファイル

対象言語に応じて、以下の手順とテンプレートを読んでから実行せよ。対象言語は引数で指定する。省略時は、リポジトリのファイル（`package.json`、`pyproject.toml`、`composer.json` など）から判定せよ。

- js：`references/js.md`
- python：`references/python.md`
- php：`references/php.md`

## 実行内容

1. **Docker化**
   - Docker用の設定ファイル。`--skip-docker`オプション指定時には作成するな。
      - マルチステージビルド対応のDockerfile
      - 開発環境を兼ねるdocker-compose.yml
      - .dockerignore

2. **CI/CD**
   - GitHub Actions用のyamlファイル。`--skip-ci`オプション指定時には作成するな。
      - workflows/lint.yml
      - workflows/audit.yml
      - workflows/test.yml
      - workflows/e2e.yml
      - workflows/docker-build.yml
      - dependabot.yml

3. **READMEの更新**
   - README.mdのフォーマットを更新せよ。`--readme-only`オプション指定時にはREADMEのみ更新せよ。
      - `references/readme.md`のフォーマット例に従って、リポジトリの内容に合わせて適宜修正せよ。

## オプション

- `--skip-docker`：上で指定されているDockerコンテナの構築に関わるファイルをすべて作成・更新するな
- `--skip-ci`：上で指定されているCI/CD関連ファイルをすべて作成・更新するな
- `--readme-only`：READMEのみ更新せよ
