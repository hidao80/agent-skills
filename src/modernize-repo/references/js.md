# JavaScript/TypeScriptプロジェクトのモダナイズ

このプロンプトにしたがって、JavaScript/TypeScriptプロジェクトをモダナイズする。

- [JavaScript/TypeScriptプロジェクトのモダナイズ](#javascripttypescriptプロジェクトのモダナイズ)
  - [パッケージマネージャーの判定](#パッケージマネージャーの判定)
  - [手順](#手順)
    - [1. Docker化](#1-docker化)
      - [Dockerfile（マルチステージビルド）](#dockerfileマルチステージビルド)
        - [npm](#npm)
        - [pnpm](#pnpm)
        - [yarn](#yarn)
        - [bun](#bun)
        - [deno](#deno)
      - [docker-compose.yml（開発用）](#docker-composeyml開発用)
        - [npm / yarn / pnpm](#npm--yarn--pnpm)
        - [bun](#bun-1)
        - [deno](#deno-1)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD（GitHub Actions）](#2-cicdgithub-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
        - [npm / pnpm / yarn / bun](#npm--pnpm--yarn--bun)
        - [deno](#deno-2)
      - [biome.json](#biomejson)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
        - [npm](#npm-1)
        - [pnpm](#pnpm-1)
        - [yarn](#yarn-1)
        - [bun](#bun-2)
        - [deno](#deno-3)
      - [.github/workflows/audit.yml（npm/pnpm/yarn/bunのみ）](#githubworkflowsauditymlnpmpnpmyarnbunのみ)
        - [npm](#npm-2)
        - [pnpm](#pnpm-2)
        - [yarn](#yarn-2)
        - [bun](#bun-3)
        - [deno](#deno-4)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
        - [npm](#npm-3)
        - [pnpm](#pnpm-3)
        - [yarn](#yarn-3)
        - [bun](#bun-4)
        - [deno](#deno-5)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Actionsのバージョン固定（pinact）](#actionsのバージョン固定pinact)
    - [3. PlaywrightによるE2Eテスト](#3-playwrightによるe2eテスト)
      - [Playwrightのセットアップ](#playwrightのセットアップ)
        - [npm/pnpm/yarn/bun](#npmpnpmyarnbun)
        - [deno](#deno-6)
      - [playwright.config.ts](#playwrightconfigts)
      - [テストファイルの例：フルページスクリーンショット](#テストファイルの例フルページスクリーンショット)
      - [.gitignoreの更新](#gitignoreの更新)
    - [4. READMEの更新](#4-readmeの更新)
      - [CIバッジ（READMEの先頭に追加）](#ciバッジreadmeの先頭に追加)
      - [クイックスタートセクション](#クイックスタートセクション)
        - [npm](#npm-4)
        - [pnpm](#pnpm-4)
        - [yarn](#yarn-4)
        - [bun](#bun-5)
        - [deno](#deno-7)
  - [注意事項](#注意事項)

## パッケージマネージャーの判定

テンプレートを適用する前に、パッケージマネージャーを判定する：

| ロックファイル | パッケージマネージャー | インストールコマンド | 実行コマンド |
|-----------|----------------|-----------------|-------------|
| `pnpm-lock.yaml` | pnpm | `pnpm install --frozen-lockfile` | `pnpm run` |
| `yarn.lock` | yarn | `yarn install --frozen-lockfile` | `yarn` |
| `bun.lockb` または `bun.lock` | bun | `bun install --frozen-lockfile` | `bun run` |
| `deno.lock` | deno | `deno install` | `deno task` |
| `package-lock.json` | npm | `npm ci` | `npm run` |
| （なし、package.jsonは存在） | npm | `npm ci` | `npm run` |

## 手順

### 1. Docker化

#### Dockerfile（マルチステージビルド）

判定したパッケージマネージャーに応じて、適切なテンプレートを選択する。

##### npm

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### pnpm

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# 本番ステージ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### yarn

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# 本番ステージ
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

##### bun

```dockerfile
# ビルドステージ
FROM oven/bun:1 AS builder
WORKDIR /app
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# 本番ステージ
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
USER nodejs
EXPOSE 3000
CMD ["bun", "dist/index.js"]
```

##### deno

```dockerfile
# ビルドステージ
FROM denoland/deno:2 AS builder
WORKDIR /app
COPY deno.json deno.lock ./
RUN deno install
COPY . .
RUN deno task build

# 本番ステージ
FROM denoland/deno:2-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 deno && \
    adduser --system --uid 1001 deno
COPY --from=builder --chown=deno:deno /app/dist ./dist
COPY --from=builder --chown=deno:deno /app/deno.json ./
USER deno
EXPOSE 3000
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "dist/index.js"]
```

#### docker-compose.yml（開発用）

##### npm / yarn / pnpm

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: ${PKG_RUN_CMD:-npm run} dev  # 置き換え例: yarn dev / pnpm run dev
```

##### bun

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: bun run dev
```

##### deno

```yaml
services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    environment:
      - DENO_ENV=development
    command: deno task dev
```

#### .dockerignore

```
# 依存関係
node_modules
.pnp
.pnp.js

# ビルド成果物
dist
build
out

# Git
.git
.gitignore
.gitattributes

# 環境変数
.env
.env.*
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo

# テストとカバレッジ
coverage
.nyc_output
*.lcov

# ドキュメント
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# パッケージマネージャー
.npm
.yarn
.pnpm-store

# ログ
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.dockerignore
```

### 2. CI/CD（GitHub Actions）

判定したパッケージマネージャーに応じて、適切なワークフローを使用する。

#### .github/workflows/lint.yml

##### npm / pnpm / yarn / bun

Biomeはスタンドアロンのバイナリとして動作するため、パッケージマネージャーに関係なく共通のワークフローを使用できる。

```yaml
name: Lint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: biomejs/setup-biome@v2
        with:
          version: latest
      - run: biome lint .
```

##### deno

```yaml
name: Lint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno lint
```

#### biome.json

プロジェクトルートに、JS/TSファイル（E2Eテストを含む）用のlint設定を作成する。
npm/pnpm/yarn/bunのみ対象。

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": false
  }
}
```

#### .github/workflows/test.yml

##### npm

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

##### pnpm

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

##### yarn

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test
```

##### bun

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun test
```

##### deno

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno task test
```

#### .github/workflows/audit.yml（npm/pnpm/yarn/bunのみ）

##### npm

```yaml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
```

##### pnpm

```yaml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
```

##### yarn

```yaml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn audit --level high
```

##### bun

```yaml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm i --package-lock-only
      - run: npm audit --audit-level=high
```

##### deno

DenoはURLインポートと組み込みのセキュリティモデルを使用するため、個別のauditワークフローは不要。

#### .github/workflows/e2e.yml

手順3で用意するPlaywrightのE2Eテストを実行する。サーバーは `playwright.config.ts` の `webServer` が起動する。ブラウザーの依存パッケージをaptで導入するため、`runs-on` は `ubuntu-latest` を使用する。

##### npm

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### pnpm

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### yarn

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn playwright install --with-deps chromium
      - run: yarn test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### bun

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

##### deno

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      # deno.jsonのtest:e2eタスクはnpx経由でPlaywrightを実行する
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: deno install
      - run: npx playwright install --with-deps chromium
      - run: deno task test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

#### .github/workflows/docker-build.yml

```yaml
name: Docker Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docker-build:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ${{ github.repository }}:${{ github.sha }} .
```

#### .github/dependabot.yml

`dependabot.yml` はワークフローではないため、`.github/workflows/` ではなく `.github/` 直下に置く。

```yaml
version: 2
updates:
  # npm/pnpm/yarnは "npm"、bunは "bun" を指定する。
  # denoはDependabotの対象外のため、このエントリーを削除する。
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

#### Actionsのバージョン固定（pinact）

ワークフローの作成後、リポジトリルートでpinactを実行し、すべてのワークフローの `uses:` をコミットハッシュに固定する。テンプレートの `@v4` などのタグは、`@<コミットハッシュ> # v4` の形式に書き換えられる。コミットハッシュは手書きしないこと。

```bash
pinact run
```

pinactのインストール方法は https://github.com/suzuki-shunsuke/pinact を参照する。

### 3. PlaywrightによるE2Eテスト

#### Playwrightのセットアップ

Playwrightを開発用依存関係として追加し、設定を初期化する。ここで用意するテストは、ローカルでも `e2e.yml` でも実行する。

##### npm/pnpm/yarn/bun

`package.json` に追加する：

```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@playwright/test": "^1.49.0"
  },
  "scripts": {
    "lint": "biome lint .",
    "screenshot": "playwright test tests/e2e/screenshot.spec.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

##### deno

`deno.json` に追加する：

```json
{
  "tasks": {
    "test:e2e": "npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "test:e2e:headed": "npx playwright test --headed"
  }
}
```

#### playwright.config.ts

すべてのパッケージマネージャー共通の設定ファイルを作成する：

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'fhd',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: 'npm run dev',  // パッケージマネージャーに応じて調整
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### テストファイルの例：フルページスクリーンショット

`tests/e2e/screenshot.spec.ts` を作成する：

```typescript
import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
];

test.describe('フルページスクリーンショットテスト', () => {
  for (const pageInfo of PAGES) {
    test(`${pageInfo.name} を撮影`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // ファイル名の例: homepage-mobile.png / about-tablet.png / contact-fhd.png
      await page.screenshot({
        path: `screenshots/${pageInfo.name}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveTitle(/.+/);
    });
  }
});
```

#### .gitignoreの更新

`.gitignore` に追加する：

```
# Playwright
test-results/
playwright-report/
playwright/.cache/
screenshots/
```

### 4. READMEの更新

既存のREADME.mdに以下を追加する。

#### CIバッジ（READMEの先頭に追加）

```markdown
![Lint](https://github.com/{owner}/{repo}/actions/workflows/lint.yml/badge.svg)
![Test](https://github.com/{owner}/{repo}/actions/workflows/test.yml/badge.svg)
![Audit](https://github.com/{owner}/{repo}/actions/workflows/audit.yml/badge.svg)
![E2E](https://github.com/{owner}/{repo}/actions/workflows/e2e.yml/badge.svg)
![Docker Build](https://github.com/{owner}/{repo}/actions/workflows/docker-build.yml/badge.svg)
```

注意：denoプロジェクトの場合、Auditバッジは省略する。

#### クイックスタートセクション

判定したパッケージマネージャーに応じて、適切なセクションを選択する。

##### npm

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker compose up --build
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman compose up --build
```

### ローカルで実行

```bash
npm install
npm run dev
```
~~~

##### pnpm

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker compose up --build
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman compose up --build
```

### ローカルで実行

```bash
pnpm install
pnpm run dev
```
~~~

##### yarn

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker compose up --build
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman compose up --build
```

### ローカルで実行

```bash
yarn install
yarn dev
```
~~~

##### bun

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker compose up --build
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman compose up --build
```

### ローカルで実行

```bash
bun install
bun run dev
```
~~~

##### deno

~~~markdown
## クイックスタート

### Dockerで実行

```bash
# 開発
docker compose up

# 本番ビルド
docker compose up --build
```

### Podmanで実行

```bash
# 開発
podman compose up

# 本番ビルド
podman compose up --build
```

### ローカルで実行

```bash
deno install
deno task dev
```
~~~

## 注意事項

- ロックファイルを優先順位（pnpm → yarn → bun → deno → npm）の順に確認して、パッケージマネージャーを判定すること
- 設定ファイルに適切なスクリプトが定義されていることを確認すること：
  - **npm/pnpm/yarn/bun**：`package.json` に `build`、`dev`、`lint`、`test`、`test:e2e` スクリプトが必要
  - **deno**：`deno.json` に `build`、`dev`、`test`、`test:e2e` タスクが必要
- プロジェクト構成に合わせて、Dockerfileのビルドコマンドとエントリーポイントを必要に応じて調整すること
- lint（Biome）：
  - npm/pnpm/yarn/bun：GitHub Actionの `biomejs/setup-biome@v2` 経由で `biome lint .` を実行（Node.jsのセットアップは不要）
  - deno：`deno lint`（組み込みのリンター）
  - プロジェクトルートに `biome.json` を作成してルールを設定する
  - ローカル実行：`npx biome lint .`、またはdevDependencyとしてインストールして `npm run lint` を使用
- セキュリティ監査コマンドはパッケージマネージャーによって異なる：
  - npm：`npm audit fix`
  - pnpm：`pnpm audit --fix`
  - yarn：`yarn audit`（手動での修正が必要）
  - bun：組み込みのauditなし（package-lock.jsonを用いて `npm audit` を使用）
  - deno：URLインポートと組み込みのセキュリティモデルを使用
- PlaywrightによるE2Eテスト：
  - CI：`e2e.yml` で実行する（判定したパッケージマネージャーのテンプレートを使用）
  - Playwrightのインストール：`npx playwright install`（またはパッケージマネージャーの同等コマンドを使用）
  - ローカルでテストを実行：`npm run test:e2e`（パッケージマネージャーに合わせて調整）
  - UIモードでテストを実行：`npm run test:e2e:ui`
  - パッケージマネージャーに合わせて、`playwright.config.ts` のwebServerコマンドを更新する
  - フルページのスクリーンショットは `screenshots/` ディレクトリに保存される（`.gitignore` に追加すること）
- ワークフローを追加・変更したら、`pinact run` でActionsのバージョンをコミットハッシュに固定し直すこと
