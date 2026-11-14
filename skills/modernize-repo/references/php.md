# Modernizing a PHP Project

Modernize the PHP project by following this prompt.

- [Modernizing a PHP Project](#modernizing-a-php-project)
  - [Procedure](#procedure)
    - [1. Dockerization](#1-dockerization)
      - [Dockerfile (Multi-Stage Build)](#dockerfile-multi-stage-build)
      - [docker-compose.yml (Development)](#docker-composeyml-development)
      - [docker/nginx/default.conf](#dockernginxdefaultconf)
      - [.dockerignore](#dockerignore)
    - [2. CI/CD (GitHub Actions)](#2-cicd-github-actions)
      - [.github/workflows/lint.yml](#githubworkflowslintyml)
      - [.github/workflows/test.yml](#githubworkflowstestyml)
      - [.github/workflows/audit.yml](#githubworkflowsaudityml)
      - [.github/workflows/e2e.yml](#githubworkflowse2eyml)
      - [.github/workflows/docker-build.yml](#githubworkflowsdocker-buildyml)
      - [.github/dependabot.yml](#githubdependabotyml)
      - [Pinning Action Versions (pinact)](#pinning-action-versions-pinact)
    - [3. E2E Tests with Playwright](#3-e2e-tests-with-playwright)
      - [Setting Up Playwright in a PHP Project](#setting-up-playwright-in-a-php-project)
      - [Creating package.json](#creating-packagejson)
      - [biome.json](#biomejson)
      - [playwright.config.ts](#playwrightconfigts)
      - [Example Test File: Full-Page Screenshots](#example-test-file-full-page-screenshots)
      - [Updating .gitignore](#updating-gitignore)
    - [4. Updating the README](#4-updating-the-readme)
      - [CI Badges (Add to the Top of the README)](#ci-badges-add-to-the-top-of-the-readme)
      - [Quick Start Section](#quick-start-section)
  - [Notes](#notes)

## Procedure

### 1. Dockerization

#### Dockerfile (Multi-Stage Build)

```dockerfile
# Build stage
FROM composer:2 AS builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader
COPY . .
RUN composer dump-autoload --optimize

# Production stage
FROM php:8.3-fpm-alpine AS runner
WORKDIR /var/www/html

# Install required extensions
RUN docker-php-ext-install pdo pdo_mysql opcache

# Configure OPcache
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Create a non-root user
RUN addgroup -g 1001 -S phpuser && \
    adduser -u 1001 -S phpuser -G phpuser

COPY --from=builder --chown=phpuser:phpuser /app/vendor ./vendor
COPY --chown=phpuser:phpuser . .

USER phpuser
EXPOSE 9000
CMD ["php-fpm"]
```

#### docker-compose.yml (Development)

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
# Dependencies
vendor

# Git
.git
.gitignore
.gitattributes

# Environment variables
.env
.env.*
!.env.example

# IDE
.vscode
.idea
*.swp
*.swo

# Tests and coverage
.phpunit.result.cache
.phpunit.cache
coverage
.coverage

# Documentation
*.md
docs

# CI/CD
.github
.gitlab-ci.yml
.circleci

# Cache
var/cache
var/log
storage/logs
bootstrap/cache

# Logs
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

### 2. CI/CD (GitHub Actions)

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

  # Lint JS/TS files such as E2E tests (biome.json is created in step 3)
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
    # Use ubuntu-latest because browser dependencies are installed via apt
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

      # package-lock.json is in .gitignore, so use npm install instead of npm ci
      - name: Install Node.js dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      # The webServer in playwright.config.ts starts the server with php -S
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

`dependabot.yml` is not a workflow, so place it directly under `.github/`, not in `.github/workflows/`.

```yaml
version: 2
updates:
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"

  # package.json for E2E tests
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

#### Pinning Action Versions (pinact)

After creating the workflows, run pinact at the repository root to pin `uses:` in every workflow to a commit hash. Tags such as `@v4` in the templates are rewritten into the form `@<commit-hash> # v4`. Do not write commit hashes by hand.

```bash
pinact run
```

For how to install pinact, see https://github.com/suzuki-shunsuke/pinact.

### 3. E2E Tests with Playwright

#### Setting Up Playwright in a PHP Project

Even in a PHP project, you can use Playwright (Node.js-based) for E2E tests. The tests prepared here are run both locally and in `e2e.yml`.

#### Creating package.json

Add `package.json` to the root of the PHP project:

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

Create a lint configuration for JS/TS files (including E2E tests) at the project root.

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

Create the configuration file:

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

#### Example Test File: Full-Page Screenshots

Create `tests/e2e/screenshot.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
];

test.describe('Full-page screenshot tests', () => {
  for (const pageInfo of PAGES) {
    test(`capture ${pageInfo.name}`, async ({ page }, testInfo) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Example file names: homepage-mobile.png / about-tablet.png / contact-fhd.png
      await page.screenshot({
        path: `screenshots/${pageInfo.name}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveTitle(/.+/);
    });
  }
});
```

#### Updating .gitignore

Add to `.gitignore`:

```
# Node.js (for Playwright)
node_modules/
package-lock.json

# Playwright
test-results/
playwright-report/
playwright/.cache/
screenshots/
```

### 4. Updating the README

Add the following to the existing README.md.

#### CI Badges (Add to the Top of the README)

```markdown
![Lint](https://github.com/{owner}/{repo}/actions/workflows/lint.yml/badge.svg)
![Test](https://github.com/{owner}/{repo}/actions/workflows/test.yml/badge.svg)
![Audit](https://github.com/{owner}/{repo}/actions/workflows/audit.yml/badge.svg)
![E2E](https://github.com/{owner}/{repo}/actions/workflows/e2e.yml/badge.svg)
![Docker Build](https://github.com/{owner}/{repo}/actions/workflows/docker-build.yml/badge.svg)
```

#### Quick Start Section

~~~markdown
## Quick Start

### Run with Docker

```bash
# Development
docker compose up

# Production build
docker compose up --build
```

### Run with Podman

```bash
# Development
podman compose up

# Production build
podman compose up --build
```

### Run Locally

```bash
composer install
php -S localhost:8000 -t public
```
~~~

## Notes

- Make sure the required scripts and dependencies are defined in `composer.json`
- If you use Mago, create the configuration file `mago.toml`
- Adjust the PHP extensions and entry point in the Dockerfile as needed
- If the security audit finds vulnerabilities, fix them with `composer update`
- JS/TS linting with Biome:
  - Create `biome.json` at the project root and configure the lint rules
  - CI: the `js-lint` job in `lint.yml` runs `biome lint .` using the `biomejs/setup-biome@v2` action (no Node.js setup required)
  - Local run: `npm run lint` (via the `lint` script in `package.json`)
- E2E tests with Playwright (requires Node.js):
  - Create a `package.json` at the project root that includes Biome and Playwright as dependencies
  - Install dependencies: `npm install` followed by `npx playwright install`
  - Run tests locally: `npm run test:e2e`
  - Run tests in UI mode: `npm run test:e2e:ui`
  - If you use a different PHP server setup, update the webServer command in `playwright.config.ts`
  - Full-page screenshots are saved to the `screenshots/` directory (add it to `.gitignore`)
  - Add `node_modules/` and Playwright artifacts to `.gitignore`
  - CI: runs in `e2e.yml`. Because `package-lock.json` is in `.gitignore`, use `npm install` instead of `npm ci`
- After adding or changing workflows, re-pin the Action versions to commit hashes with `pinact run`
