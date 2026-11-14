# PHPプロジェクトのモダナイズ

このプロンプトにしたがって、PHPプロジェクトをモダナイズする。

- [PHPプロジェクトのモダナイズ](#phpプロジェクトのモダナイズ)
  - [手順](#手順)
    - [1. Docker化](#1-docker化)
      - [Dockerfile（マルチステージビルド）](#dockerfileマルチステージビルド)
      - [docker-compose.yml（開発用）](#docker-composeyml開発用)
      - [docker/nginx/default.conf](#dockernginxdefaultconf)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD（GitHub Actions）](#2-cicdgithub-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
      - [.github/workflows/audit.yml](#githubworkflowsaudityml)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Actionsのバージョン固定（pinact）](#actionsのバージョン固定pinact)
    - [3. PlaywrightによるE2Eテスト](#3-playwrightによるe2eテスト)
      - [PHPプロジェクトでのPlaywrightのセットアップ](#phpプロジェクトでのplaywrightのセットアップ)
      - [package.jsonの作成](#packagejsonの作成)
      - [biome.json](#biomejson)
      - [playwright.config.ts](#playwrightconfigts)
      - [テストファイルの例：フルページスクリーンショット](#テストファイルの例フルページスクリーンショット)
      - [.gitignoreの更新](#gitignoreの更新)
    - [4. READMEの更新](#4-readmeの更新)
      - [CIバッジ（READMEの先頭に追加）](#ciバッジreadmeの先頭に追加)
      - [クイックスタートセクション](#クイックスタートセクション)
  - [注意事項](#注意事項)

## 手順

### 1. Docker化

#### Dockerfile（マルチステージビルド）

```dockerfile
# ビルドステージ
FROM composer:2 AS builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader
COPY . .
RUN composer dump-autoload --optimize

# 本番ステージ
FROM php:8.3-fpm-alpine AS runner
WORKDIR /var/www/html

# 必要な拡張機能をインストール
RUN docker-php-ext-install pdo pdo_mysql opcache

# OPcacheの設定
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# 非rootユーザーを作成
RUN addgroup -g 1001 -S phpuser && \
    adduser -u 1001 -S phpuser -G phpuser

COPY --from=builder --chown=phpuser:phpuser /app/vendor ./vendor
COPY --chown=phpuser:phpuser . .

USER phpuser
EXPOSE 9000
CMD ["php-fpm"]
```

#### docker-compose.yml（開発用）

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: runner
    volumes:
      - .:/var/www/html
    environment:
      - APP_ENV=development
    depends_on:
      - db

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  db_data:
```

#### docker/nginx/default.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

#### .dockerignore

```
# 依存関係
vendor

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
.phpunit.result.cache
.phpunit.cache
coverage
.coverage

# ドキュメント
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# キャッシュ
var/cache
var/log
storage/logs
bootstrap/cache

# ログ
*.log

# OS
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*
.dockerignore
docker/
```

### 2. CI/CD（GitHub Actions）

#### .github/workflows/lint.yml

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

      - name: Setup Mago
        uses: carthage-software/setup-mago@v1

      - name: Run Mago Lint
        run: mago lint

      - name: Run Mago Analyse
        run: mago analyse

  # E2EテストなどJS/TSファイルのlint（biome.jsonは手順3で作成）
  js-lint:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4
      - uses: biomejs/setup-biome@v2
        with:
          version: latest
      - run: biome lint .
```

#### .github/workflows/test.yml

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

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          coverage: xdebug

      - name: Get Composer cache directory
        id: composer-cache
        run: echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: ${{ steps.composer-cache.outputs.dir }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: Run tests
        run: vendor/bin/phpunit
```

#### .github/workflows/audit.yml

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

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'

      - name: Security audit
        run: composer audit
```

#### .github/workflows/e2e.yml

```yaml
name: E2E

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    # ブラウザーの依存パッケージをaptで導入するため ubuntu-latest を使用
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'

      - name: Install Composer dependencies
        run: composer install --prefer-dist --no-progress

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # package-lock.jsonは.gitignore対象のため、npm ciではなくnpm installを使用
      - name: Install Node.js dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      # playwright.config.tsのwebServerが php -S でサーバーを起動する
      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
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

      - name: Build Docker image
        run: docker build -t ${{ github.repository }}:${{ github.sha }} .
```

#### .github/dependabot.yml

`dependabot.yml` はワークフローではないため、`.github/workflows/` ではなく `.github/` 直下に置く。

```yaml
version: 2
updates:
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"

  # E2Eテスト用のpackage.json
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

#### PHPプロジェクトでのPlaywrightのセットアップ

PHPプロジェクトであっても、E2EテストにはPlaywright（Node.jsベース）を使用できる。ここで用意するテストは、ローカルでも `e2e.yml` でも実行する。

#### package.jsonの作成

PHPプロジェクトのルートに `package.json` を追加する：

```json
{
  "name": "php-e2e-tests",
  "version": "1.0.0",
  "private": true,
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

#### biome.json

プロジェクトルートに、JS/TSファイル（E2Eテストを含む）用のlint設定を作成する。

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

#### playwright.config.ts

設定ファイルを作成する：

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
    baseURL: 'http://localhost:8080',
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
    command: 'php -S localhost:8080 -t public',
    url: 'http://localhost:8080',
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
# Node.js（Playwright用）
node_modules/
package-lock.json

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

#### クイックスタートセクション

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
composer install
php -S localhost:8000 -t public
```
~~~

## 注意事項

- `composer.json` に必要なスクリプトと依存関係が定義されていることを確認すること
- Magoを使用する場合は、設定ファイル `mago.toml` を作成すること
- 必要に応じてDockerfileのPHP拡張機能とエントリーポイントを調整すること
- セキュリティ監査で脆弱性が見つかった場合は、`composer update` で修正すること
- BiomeによるJS/TSのlint：
  - プロジェクトルートに `biome.json` を作成してlintルールを設定する
  - CI：`lint.yml` の `js-lint` ジョブで、`biomejs/setup-biome@v2` アクションを使って `biome lint .` を実行する（Node.jsのセットアップは不要）
  - ローカル実行：`npm run lint`（`package.json` の `lint` スクリプト経由）
- PlaywrightによるE2Eテスト（Node.jsが必要）：
  - プロジェクトルートに、BiomeとPlaywrightを依存関係に含む `package.json` を作成する
  - 依存関係のインストール：`npm install` の後に `npx playwright install`
  - ローカルでテストを実行：`npm run test:e2e`
  - UIモードでテストを実行：`npm run test:e2e:ui`
  - 別のPHPサーバー構成を使用する場合は、`playwright.config.ts` のwebServerコマンドを更新する
  - フルページのスクリーンショットは `screenshots/` ディレクトリに保存される（`.gitignore` に追加すること）
  - `node_modules/` とPlaywrightの生成物を `.gitignore` に追加する
  - CI：`e2e.yml` で実行する。`package-lock.json` を `.gitignore` 対象にしているため、`npm ci` ではなく `npm install` を使う
- ワークフローを追加・変更したら、`pinact run` でActionsのバージョンをコミットハッシュに固定し直すこと
